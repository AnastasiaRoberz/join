import { Directive, ElementRef, inject, OnDestroy, OnInit, output, signal } from '@angular/core';
import flatpickr from 'flatpickr';
// @ts-ignore
import ShortcutButtonsPlugin from 'shortcut-buttons-flatpickr';

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
  private element = inject(ElementRef<HTMLInputElement>);

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
  dateChanged = output<string>();

  /** Tracks whether the Flatpickr calendar popup is currently open. */
  isOpen = signal<boolean>(false);

  // ---------------------------------------------------------------------------
  // Lifecycle Hooks
  // ---------------------------------------------------------------------------

  /**
   * Initializes the Flatpickr instance on the host input element with custom positioning,
   * flexible date parsing, and lifecycle callbacks.
   */
  ngOnInit(): void {
    const parentContainer = this.element.nativeElement.parentElement ?? undefined;

    this.pickerInstance = flatpickr(this.element.nativeElement, {
      positionElement: parentContainer,
      ignoredFocusElements: parentContainer ? [parentContainer] : [],
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
      nextArrow: this.arrowSvg,
      prevArrow: this.arrowSvg,
      parseDate: (dateStr: string) => this.parseFlexibleDate(dateStr.trim()),
      onReady: (_selectedDates, _dateStr, instance) => {
        const todayBtn = document.createElement('button');
        todayBtn.type = 'button';
        todayBtn.textContent = 'Today';
        todayBtn.className = 'flatpickr-today-btn';
        todayBtn.onclick = () => instance.setDate(new Date(), true);
        instance.calendarContainer.appendChild(todayBtn);
        instance.currentYearElement.id = 'flatpickr-year';
      },
      onOpen: (_selectedDates, _dateStr, instance) => {
        this.isOpen.set(true);
        const targetDate = instance.selectedDates[0] ?? new Date();
        instance.jumpToDate(targetDate, false);
      },
      onClose: () => this.isOpen.set(false),
      onChange: (_selectedDates, dateStr) => this.dateChanged.emit(dateStr),
    });
  }

  /**
   * Cleans up and destroys the Flatpickr instance when the directive is destroyed.
   */
  ngOnDestroy(): void {
    this.pickerInstance?.destroy();
  }

  // ---------------------------------------------------------------------------
  // Public Control Methods
  // ---------------------------------------------------------------------------

  /**
   * Toggles the visibility of the Flatpickr calendar popup.
   */
  toggle(): void {
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
  setDate(value: string): void {
    if (!value || !this.pickerInstance) return;

    const format = value.includes('-') ? 'Y-m-d' : 'd/m/Y';
    const parsedDate = flatpickr.parseDate(value, format);

    if (parsedDate && !isNaN(parsedDate.getTime())) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      if (parsedDate < today) {
        this.pickerInstance.set('minDate', parsedDate);
      }
      this.pickerInstance.setDate(parsedDate, false);
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

    if (!parsed) return new Date(NaN);

    let [day, month, year] = parsed;
    if (year < 100) {
      year += 2000;
    }

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
    const rest = inputStr.slice(0, yearDigits);

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
