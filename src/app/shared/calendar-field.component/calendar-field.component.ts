import {
  booleanAttribute,
  ChangeDetectorRef,
  Component,
  effect,
  inject,
  input,
  signal,
  viewChild,
} from '@angular/core';
import { ControlValueAccessor, NgControl, Validators } from '@angular/forms';
import flatpickr from 'flatpickr';
import { FlatpickrDirective } from '../../directives/flatpickr.directive';
import { ResponsiveService } from '../../services/responsive.service';
import { ErrorService } from '../../services/error.service';
import { Buttons } from '../button.component/button.component';

/** Global counter used to generate unique DOM IDs for calendar field instances. */
let nextId = 0;

/**
 * Reusable form field component for selecting dates using Flatpickr.
 *
 * Implements Angular's `ControlValueAccessor` to integrate seamlessly with Reactive Forms
 * (`formControlName` / `formControl`). Automatically converts between:
 * - **Display format (`DD/MM/YYYY`)**: Shown to the user in the input field and Flatpickr calendar.
 * - **Model / Database format (`YYYY-MM-DD`)**: Emitted to the bound Angular `FormControl` for Supabase storage.
 *
 * @example
 * ```html
 * <app-calendar-field
 *   id="due-date"
 *   label="Due Date"
 *   formControlName="dueDate"
 * />
 * ```
 */
@Component({
  imports: [FlatpickrDirective, Buttons],
  selector: 'app-calendar-field',
  styleUrl: './calendar-field.component.scss',
  templateUrl: './calendar-field.component.html',
})
export class CalendarFieldComponent implements ControlValueAccessor {
  /** Service used to adapt label and error message styling to mobile/desktop viewports. */
  protected readonly responsiveService = inject(ResponsiveService);

  /** Service used to generate human-readable validation error messages. */
  private readonly errorService = inject(ErrorService);

  /** ChangeDetectorRef used to trigger view updates when the bound FormControl state changes. */
  private readonly cdr = inject(ChangeDetectorRef);

  /** Injected `NgControl` binding this component to the parent Angular form control. */
  private readonly ngControl = inject(NgControl);

  // ---------------------------------------------------------------------------
  // Inputs, View Queries & Internal State
  // ---------------------------------------------------------------------------

  /** Unique HTML id attribute for the underlying input element. */
  public readonly fieldId = input<string>(`app-calendar-${nextId++}`);

  /** Optional label text displayed above the date input field. */
  public readonly label = input<string>();

  /** Reference to the `FlatpickrDirective` instance managing the calendar popup. */
  protected readonly picker = viewChild<FlatpickrDirective>('picker');

  /** Formatted date string (`DD/MM/YYYY`) currently displayed inside the input element. */
  protected readonly value = signal<string>('');

  /**
   * When `true`, displays the generic default message "This field is required" instead of the field-specific one.
   */
  public readonly requiredMsg = input(false, { transform: booleanAttribute });

  /** Registered `ControlValueAccessor` callback invoked when the date value changes. */
  private onChange: (value: string) => void = () => {};

  /** Registered `ControlValueAccessor` callback invoked when the input loses focus. */
  protected onTouched: () => void = () => {};

  /**
   * Registers this component as the `valueAccessor` for its `NgControl`
   * and initializes reactive synchronization effects.
   */
  constructor() {
    if (this.ngControl) {
      this.ngControl.valueAccessor = this;
    }
    this.initPickerSyncEffect();
    this.initControlEventsEffect();
  }

  /** Checks whether the associated form control has the Validators.required validator attached. */
  protected isRequired(): boolean {
    const ctrl = this.ngControl?.control;
    return ctrl ? ctrl.hasValidator(Validators.required) : false;
  }

  // ---------------------------------------------------------------------------
  // ControlValueAccessor Implementation
  // ---------------------------------------------------------------------------

  /**
   * Writes an external form control value (either ISO `YYYY-MM-DD` or `DD/MM/YYYY`)
   * into the component and formats it as `DD/MM/YYYY` for display.
   *
   * @param value - The incoming date string from the Angular `FormControl`.
   */
  public writeValue(value: string): void {
    if (!value) {
      this.value.set('');
      return;
    }

    const format = value.includes('-') ? 'Y-m-d' : 'd/m/Y';
    const parsedDate = flatpickr.parseDate(value, format);
    this.value.set(parsedDate ? flatpickr.formatDate(parsedDate, 'd/m/Y') : value);
  }

  /**
   * Registers the callback function that notifies Angular forms of value changes.
   *
   * @param fn - Callback expecting an ISO-formatted date string (`YYYY-MM-DD`).
   */
  public registerOnChange(fn: (value: string) => void): void {
    this.onChange = fn;
  }

  /**
   * Registers the callback function that notifies Angular forms when the control is touched.
   *
   * @param fn - Callback invoked on input blur or date selection.
   */
  public registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  // ---------------------------------------------------------------------------
  // Event Handlers & Validation Helpers
  // ---------------------------------------------------------------------------

  /**
   * Handles date selection emitted by `FlatpickrDirective` (`DD/MM/YYYY`),
   * updates the display signal, and emits the ISO date (`YYYY-MM-DD`) to the form control.
   *
   * @param dateStr - The selected date string formatted as `DD/MM/YYYY`.
   */
  protected onDateSelect(dateStr: string): void {
    this.value.set(dateStr);
    const parsedDate = flatpickr.parseDate(dateStr, 'd/m/Y');
    const isoDate = parsedDate ? flatpickr.formatDate(parsedDate, 'Y-m-d') : dateStr;

    this.onChange(isoDate);
    this.onTouched();
  }

  /**
   * Handles manual user input in the date field.
   * If the user clears the input, notifies the Angular FormControl with an empty
   * string so the required validator triggers and the error message becomes visible.
   *
   * @param event - The native DOM input event fired on every keystroke.
   */
  protected onInputChange(event: Event): void {
    const input = event.target as HTMLInputElement;

    if (input.value === '') {
      this.value.set('');
      this.onChange('');
      this.onTouched();
    }
  }

  /**
   * Returns a localized validation error message when the bound `FormControl`
   * is invalid and has been touched.
   *
   * @returns The error message string, or `null` if the control is valid or untouched.
   */
  protected showError(): string | null {
    const ctrl = this.ngControl.control;
    if (!ctrl || !ctrl.invalid || !ctrl.touched) return null;

    const errors =
      this.requiredMsg() && ctrl.errors?.['required'] ? { requiredDefault: true } : ctrl.errors;

    return this.errorService.getErrorMessage(errors, this.label() ?? '');
  }

  /** Synchronizes the Flatpickr instance whenever value or directive reference updates. */
  private initPickerSyncEffect(): void {
    effect(() => {
      const currentPicker = this.picker();
      const currentValue = this.value();
      if (currentPicker && currentValue) {
        currentPicker.setDate(currentValue);
      }
    });
  }

  /** Subscribes to form control events to refresh validation error display. */
  private initControlEventsEffect(): void {
    effect((onCleanUp) => {
      const ctrl = this.ngControl.control;
      if (ctrl) {
        const sub = ctrl.events.subscribe(() => {
          this.cdr.markForCheck();
        });
        onCleanUp(() => sub.unsubscribe());
      }
    });
  }
}
