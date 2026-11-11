import { ScrollDispatcher } from '@angular/cdk/scrolling';
import { Directive, ElementRef, inject, OnDestroy, OnInit, output, signal } from '@angular/core';
import flatpickr from 'flatpickr';
import { Subscription } from 'rxjs';

/** Flatpickr options that are the same for every instance. */
const BASE_OPTIONS: flatpickr.Options.Options = {
  position: 'auto center',
  monthSelectorType: 'static',
  dateFormat: 'd/m/Y',
  minDate: 'today',
  locale: {
    firstDayOfWeek: 1,
  },
  weekNumbers: true,
  disableMobile: true,
  allowInput: true,
};

/**
 * Attribute directive that wraps a native `<input>` element with a customized Flatpickr
 * date picker instance.
 *
 * Key features:
 * - Positions the calendar popup relative to the parent `.input-container` (`position: 'auto center'`).
 * - Supports flexible manual date entry with or without delimiters (e.g., `8.6.27`, `08/06/2027`, `080627`).
 * - Automatically jumps to the currently selected date (or today's month if empty) whenever opened.
 * - Adjusts `minDate` dynamically when loading existing past dates (e.g., when editing older tasks).
 *
 * @example
 * ```html
 * <input
 *   type="text"
 *   #picker="appFlatpickr"
 *   appFlatpickr
 *   (dateChanged)="onDateSelect($event)"
 * />
 * <button type="button" (click)="picker.toggle()">Open Calendar</button>
 * ```
 */
@Directive({
  selector: '[appFlatpickr]',
  exportAs: 'appFlatpickr',
})
export class FlatpickrDirective implements OnInit, OnDestroy {
  /** Reference to the host `<input>` element to which Flatpickr is attached. */
  private readonly element = inject(ElementRef<HTMLInputElement>);

  /** Notifies about scrolling, so an open calendar can follow its input field. */
  private readonly scrollDispatcher = inject(ScrollDispatcher);
  /** Subscription to global scroll events used to reposition the open calendar popup. */
  private scrollSub?: Subscription;

  /** Underlying Flatpickr instance created during `ngOnInit`. */
  private pickerInstance?: flatpickr.Instance;

  /** SVG markup used for both the previous and next month navigation arrows. */
  private readonly arrowSvg = `
    <svg>
      <use href="./assets/icons/icons.svg#arrow-down"></use>
    </svg>
  `;

  // ---------------------------------------------------------------------------
  // Outputs & Reactive State
  // ---------------------------------------------------------------------------

  /** Emits the formatted date string (`DD/MM/YYYY`) whenever the user selects or types a valid date. */
  public readonly dateChanged = output<string>();

  /** Tracks whether the Flatpickr calendar popup is currently open. */
  public readonly isOpen = signal<boolean>(false);

  // ---------------------------------------------------------------------------
  // Lifecycle Hooks
  // ---------------------------------------------------------------------------

  /**
   * Initializes the Flatpickr instance on the host input element with custom positioning,
   * flexible date parsing, and lifecycle callbacks.
   */
  public ngOnInit(): void {
    const parentContainer = this.element.nativeElement.parentElement ?? undefined;

    this.pickerInstance = flatpickr(
      this.element.nativeElement,
      this.createOptions(parentContainer),
    );
    this.registerScrollListener(parentContainer);
  }

  /**
   * Cleans up and destroys the Flatpickr instance when the directive is destroyed.
   */
  public ngOnDestroy(): void {
    this.pickerInstance?.destroy();
    this.scrollSub?.unsubscribe();
  }

  // ---------------------------------------------------------------------------
  // Public Control Methods
  // ---------------------------------------------------------------------------

  /**
   * Toggles the visibility of the Flatpickr calendar popup.
   */
  public toggle(): void {
    if (this.isOpen()) {
      this.pickerInstance?.close();
    } else {
      this.pickerInstance?.open();
    }
  }

  /**
   * Programmatically sets the selected date on the Flatpickr instance without firing `onChange`.
   * If the provided date lies in the past (e.g., when editing an existing overdue task),
   * `minDate` is relaxed to allow displaying that date.
   *
   * @param value - Date string in either ISO (`YYYY-MM-DD`) or display (`DD/MM/YYYY`) format.
   */
  public setDate(value: string): void {
    if (!value || !this.pickerInstance) return;

    const format = value.includes('-') ? 'Y-m-d' : 'd/m/Y';
    const parsedDate = flatpickr.parseDate(value, format);

    if (parsedDate && !isNaN(parsedDate.getTime())) {
      this.relaxMinDateIfPast(parsedDate);
      this.pickerInstance.setDate(parsedDate, false);
    }
  }

  // ---------------------------------------------------------------------------
  // Private Setup Helpers
  // ---------------------------------------------------------------------------

  /**
   * Builds the Flatpickr options: shared base options plus positioning, arrows,
   * flexible date parsing and the lifecycle callbacks.
   *
   * @param parentContainer - Parent of the input, used to position the popup and ignore its focus.
   */
  private createOptions(parentContainer?: HTMLElement): flatpickr.Options.Options {
    return {
      ...BASE_OPTIONS,
      positionElement: parentContainer,
      ignoredFocusElements: parentContainer ? [parentContainer] : [],
      nextArrow: this.arrowSvg,
      prevArrow: this.arrowSvg,
      parseDate: (dateStr: string) => this.parseFlexibleDate(dateStr.trim()),
      onReady: (_selectedDates, _dateStr, instance) => this.handleCalendarReady(instance),
      onOpen: (_selectedDates, _dateStr, instance) => this.handleCalendarOpen(instance),
      onClose: () => this.isOpen.set(false),
      onChange: (_selectedDates, dateStr) => this.dateChanged.emit(dateStr),
    };
  }

  /**
   * Adds the "Today" button to the calendar and gives the year input an id.
   *
   * @param instance - The Flatpickr instance that became ready.
   */
  private handleCalendarReady(instance: flatpickr.Instance): void {
    const todayBtn = document.createElement('button');
    todayBtn.type = 'button';
    todayBtn.textContent = 'Today';
    todayBtn.className = 'flatpickr-today-btn';
    todayBtn.onclick = () => instance.setDate(new Date(), true);
    if (instance.calendarContainer) {
      instance.calendarContainer.appendChild(todayBtn);
    }
    if (instance.currentYearElement) {
      instance.currentYearElement.id = 'flatpickr-year';
    }
  }

  /**
   * Marks the calendar as open and jumps to the selected date (or today if none is selected).
   *
   * @param instance - The Flatpickr instance that was opened.
   */
  private handleCalendarOpen(instance: flatpickr.Instance): void {
    this.isOpen.set(true);
    const targetDate = instance.selectedDates[0] ?? new Date();
    instance.jumpToDate(targetDate, false);
  }

  /**
   * Keeps an open calendar attached to its input while a scrollable parent is scrolled.
   *
   * @param parentContainer - Element the calendar is positioned relative to.
   */
  private registerScrollListener(parentContainer?: HTMLElement): void {
    this.scrollSub = this.scrollDispatcher.scrolled().subscribe(() => {
      if (this.pickerInstance?.isOpen) {
        this.pickerInstance._positionCalendar(parentContainer);
      }
    });
  }

  /**
   * Relaxes `minDate` if the given date lies in the past, so that it can still be displayed.
   *
   * @param date - Date that is about to be set.
   */
  private relaxMinDateIfPast(date: Date): void {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (date < today) {
      this.pickerInstance?.set('minDate', date);
    }
  }

  // ---------------------------------------------------------------------------
  // Private Date Parsing Helpers
  // ---------------------------------------------------------------------------

  /**
   * Parses user-typed date strings in both delimited (`08/06/2027`, `8.6.27`, `8-6-2027`)
   * and compact numeric (`8627`, `080627`, `08062027`) formats.
   *
   * @param inputStr - Trimmed raw string entered by the user.
   * @returns A valid `Date` object, or `new Date(NaN)` if the input cannot be parsed.
   */
  private parseFlexibleDate(inputStr: string): Date {
    if (!inputStr) return new Date(NaN);

    let parsed: [number, number, number] | null = null;

    if (/[\.\/\-]/.test(inputStr)) {
      parsed = this.parseDelimitedDate(inputStr);
    } else if (/^\d{4,8}$/.test(inputStr)) {
      parsed = this.parseCompactNumericDate(inputStr);
    }

    return parsed ? this.createValidatedDate(parsed) : new Date(NaN);
  }

  /**
   * Builds a `Date` from day, month and year. Two-digit years are treated as 20xx.
   *
   * @param parts - `[day, month, year]`.
   * @returns The date, or `new Date(NaN)` if day, month or year are out of range.
   */
  private createValidatedDate([day, month, rawYear]: [number, number, number]): Date {
    const year = rawYear < 100 ? rawYear + 2000 : rawYear;

    const isValidRange =
      day >= 1 && day <= 31 && month >= 1 && month <= 12 && year >= 1900 && year <= 2100;

    return isValidRange ? new Date(year, month - 1, day) : new Date(NaN);
  }

  /**
   * Extracts `[day, month, year]` from a date string separated by `.`, `/`, or `-`.
   *
   * @param inputStr - Delimited date string (e.g., `8.6.27` or `08/06/2027`).
   * @returns Tuple of `[day, month, year]` or `null` if invalid.
   */
  private parseDelimitedDate(inputStr: string): [number, number, number] | null {
    const parts = inputStr.split(/[\.\/\-]/).map((part) => parseInt(part, 10));
    if (parts.length === 3 && !parts.some(isNaN)) {
      return [parts[0], parts[1], parts[2]];
    }
    return null;
  }

  /**
   * Extracts `[day, month, year]` from a continuous digit sequence of 4 to 8 digits
   * (e.g., `8627` -> `8/6/27`, `08062027` -> `08/06/2027`).
   *
   * @param inputStr - Numeric string of 4 to 8 digits.
   * @returns Tuple of `[day, month, year]` or `null` if invalid.
   */
  private parseCompactNumericDate(inputStr: string): [number, number, number] | null {
    const hasFourDigitYear =
      inputStr.length >= 7 || (inputStr.length === 6 && parseInt(inputStr.slice(-4), 10) >= 2000);

    const yearDigits = hasFourDigitYear ? -4 : -2;
    const year = parseInt(inputStr.slice(yearDigits), 10);

    return this.splitDayAndMonth(inputStr.slice(0, yearDigits), year);
  }

  /**
   * Splits the digits in front of the year into day and month.
   * With three digits a leading `0` belongs to the day (`082` -> 08/2), otherwise one digit is the day.
   *
   * @param rest - The 2 to 4 digits in front of the year.
   * @param year - The already parsed year.
   * @returns Tuple of `[day, month, year]` or `null` if `rest` has an unsupported length.
   */
  private splitDayAndMonth(rest: string, year: number): [number, number, number] | null {
    if (rest.length === 2) {
      return [parseInt(rest[0], 10), parseInt(rest[1], 10), year];
    }
    if (rest.length === 3) {
      const splitIdx = rest.startsWith('0') ? 2 : 1;
      return [parseInt(rest.slice(0, splitIdx), 10), parseInt(rest.slice(splitIdx), 10), year];
    }
    if (rest.length === 4) {
      return [parseInt(rest.slice(0, 2), 10), parseInt(rest.slice(2, 4), 10), year];
    }
    return null;
  }
}
