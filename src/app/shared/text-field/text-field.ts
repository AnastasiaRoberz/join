import { ChangeDetectorRef, Component, effect, inject, input } from '@angular/core';
import { ErrorService } from '../../services/error.service';
import { ControlValueAccessor, NgControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { ResponsiveService } from '../../services/responsive.service';

/** Module-level counter used to generate a unique default DOM id for every TextField instance. */
let nextId = 0;

/**
 * Reusable text input / textarea with an optional label, icon and inline validation message.
 *
 * Implements {@link ControlValueAccessor}, so it can be used directly with reactive forms via
 * `formControlName` or `[formControl]`. The component injects its own `NgControl` and registers
 * itself as the value accessor in the constructor (instead of providing `NG_VALUE_ACCESSOR`),
 * which gives it access to the bound control and its validation state.
 *
 * Validation errors are not shown while the user is still typing for the first time: the message
 * of the first error (translated by {@link ErrorService}) appears only once the control is both
 * `invalid` and `touched` (i.e. after the field lost focus). The label text is passed to the
 * error service so messages such as "Your Name is required." can include it.
 *
 * Inputs:
 * - `label`: label text (also used in error messages). No label is rendered when omitted.
 * - `labelPos`: `'inner'` (default, label inside the field container) or `'top'` (label above the field).
 * - `icon`: name of a symbol in `assets/icons/icons.svg` that is rendered inside the field.
 * - `type`: `'input'` (default, single line text) or `'textarea'`.
 * - `placeholder`: placeholder text. Defaults to a single space (`' '`), which keeps the
 *   CSS `:placeholder-shown` state usable for the floating inner label.
 * - `id`: DOM id for the input/label association. Auto-generated (`app-input-N`) if omitted.
 *
 * The host element gets the CSS class `is-mobile` on small screens (see {@link ResponsiveService}).
 *
 * @example
 * <form [formGroup]="contactForm">
 *   <app-text-field formControlName="name" label="Name" icon="person" placeholder="Name"></app-text-field>
 *   <app-text-field formControlName="message" label="Message" labelPos="top" type="textarea"></app-text-field>
 * </form>
 */
@Component({
  imports: [ReactiveFormsModule],
  selector: 'app-text-field',
  styleUrl: './text-field.scss',
  templateUrl: './text-field.html',
  host: {
    '[class.is-mobile]': 'responsiveService.isMobile()',
  },
})
export class TextField implements ControlValueAccessor {
  /** Translates validation error objects into user-facing messages. */
  errorService = inject(ErrorService);
  /** Provides the screen-size signals used for the mobile styling. */
  responsiveService = inject(ResponsiveService);
  /** Used to mark the component for check when the form control changes from outside. */
  cdr = inject(ChangeDetectorRef);

  /** The form control directive this field is bound to (`formControlName` / `formControl`). Gives access to the control's value and validation state. */
  ngControl = inject(NgControl);
  /** Label text. Also passed to the {@link ErrorService} for error messages. No label is rendered if empty. */
  label = input<string>();
  /** Name of a symbol in `assets/icons/icons.svg` shown inside the field. No icon if empty. */
  icon = input<string>();
  /** DOM id of the input/textarea, linked to the label via `for`. Defaults to a unique generated id. */
  id = input<string>(`app-input-${nextId++}`);
  /** Label position: `'inner'` (inside the field container, default) or `'top'` (above the field). */
  labelPos = input<string>('inner');
  /** Renders either a single-line `<input type="text">` or a multi-line `<textarea>`. */
  type = input<'input' | 'textarea'>('input');
  /** Placeholder text. The default single space keeps `:placeholder-shown` based styling working. */
  placeholder = input<string>(' ');

  /** Current value displayed in the field. Updated by user input and by `writeValue()`. */
  value: string = '';

  /** Callback registered by Angular forms; call it to propagate a new value to the form control. */
  onChange: (value: string) => void = () => {};
  /** Callback registered by Angular forms; called on blur to mark the control as touched. */
  onTouched: () => void = () => {};

  isRequired(): boolean {
    const ctrl = this.ngControl?.control;
    return ctrl ? ctrl.hasValidator(Validators.required) : false;
  }

  constructor() {
    if (this.ngControl) {
      this.ngControl.valueAccessor = this;
    }

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

  /**
   * ControlValueAccessor: called by Angular when the form model changes programmatically
   * (e.g. `setValue()`, `patchValue()`, `reset()`).
   *
   * @param value - The new model value. `null`/`undefined` are displayed as an empty string.
   */
  writeValue(value: string): void {
    this.value = value ?? '';
    this.cdr.markForCheck();
  }

  /**
   * ControlValueAccessor: stores the callback used to report view-to-model value changes.
   *
   * @param fn - Callback that updates the form control with the new value.
   */
  registerOnChange(fn: (value: string) => void): void {
    this.onChange = fn;
  }

  /**
   * ControlValueAccessor: stores the callback used to report that the field was touched (blurred).
   *
   * @param fn - Callback that marks the form control as touched.
   */
  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  /**
   * Handles the `input` event of the native input/textarea: stores the value locally and
   * propagates it to the bound form control.
   *
   * @param event - The native input event.
   */
  onInput(event: Event): void {
    const value = (event.target as HTMLInputElement | HTMLTextAreaElement).value;
    this.value = value;
    this.onChange(value);
  }

  /**
   * Returns the error message to display below the field.
   *
   * @returns The message for the first validation error of the control, or `null` if there is
   * no control, the control is valid, or it has not been touched yet.
   */
  showError(): string | null {
    const ctrl = this.ngControl.control;

    if (!ctrl || !ctrl.invalid || !ctrl.touched) return null;

    return this.errorService.getErrorMessage(ctrl.errors, this.label() ?? '');
  }
}
