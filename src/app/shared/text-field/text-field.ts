import {
  booleanAttribute,
  ChangeDetectorRef,
  Component,
  effect,
  inject,
  input,
  signal,
} from '@angular/core';
import { ErrorService } from '../../services/error.service';
import { ControlValueAccessor, NgControl, Validators } from '@angular/forms';
import { ResponsiveService } from '../../services/responsive.service';
import { Buttons } from '../button.component/button.component';

/** Module-level counter used to generate a unique default DOM id for every TextField instance. */
let nextId = 0;

/**
 * Reusable text input / textarea with an optional label, icon and inline validation message.
 *
 * Implements {@link ControlValueAccessor}, so it can be used directly with reactive forms via
 * `formControlName` or `[formControl]`. The component injects its own `NgControl` and registers
 * itself as the value accessor in the constructor, which gives it access to the bound control.
 *
 * Validation errors appear only once the control is both `invalid` and `touched`.
 *
 * Inputs:
 * - `label`: label text (also used in error messages). No label is rendered when omitted.
 * - `labelPos`: `'inner'` (default, label inside the field container) or `'top'` (label above the field).
 * - `icon`: name of a symbol in `assets/icons/icons.svg` that is rendered inside the field.
 * - `type`: `'input'` (default, single line text) or `'textarea'`.
 * - `placeholder`: placeholder text. Defaults to a single space (`' '`).
 * - `fieldId`: DOM id for the input/label association. Auto-generated (`app-input-N`) if omitted.
 *
 * @example
 * <form [formGroup]="contactForm">
 *   <app-text-field formControlName="name" label="Name" icon="person" placeholder="Name"></app-text-field>
 *   <app-text-field formControlName="message" label="Message" labelPos="top" type="textarea"></app-text-field>
 * </form>
 */
@Component({
  imports: [Buttons],
  selector: 'app-text-field',
  styleUrl: './text-field.scss',
  templateUrl: './text-field.html',
})
export class TextField implements ControlValueAccessor {
  /** Translates validation error objects into user-facing messages. */
  private readonly errorService = inject(ErrorService);

  /** Provides screen-size signals used for responsive styling in templates. */
  protected readonly responsiveService = inject(ResponsiveService);

  /** Used to mark the component for check when the form control changes from outside. */
  private readonly cdr = inject(ChangeDetectorRef);

  /** The form control directive this field is bound to (`formControlName` / `formControl`). */
  private readonly ngControl = inject(NgControl);

  /** Label text. Also passed to the {@link ErrorService} for error messages. No label is rendered if empty. */
  public readonly label = input<string>();

  /** Name of a symbol in `assets/icons/icons.svg` shown inside the field. No icon if empty. */
  public readonly icon = input<string>();

  /** DOM id of the input/textarea, linked to the label via `for`. Defaults to a unique generated id. */
  public readonly fieldId = input<string>(`app-input-${nextId++}`);

  /** Label position: `'inner'` (inside the field container, default) or `'top'` (above the field). */
  public readonly labelPos = input<string>('inner');

  /** Renders either a single-line `<input type="text">` or a multi-line `<textarea>`. */
  public readonly type = input<'input' | 'textarea'>('input');

  /** Input type string for specialized fields such as `'password'`. */
  public readonly inputType = input<string | null>('text');

  /** Placeholder text. The default single space keeps `:placeholder-shown` based styling working. */
  public readonly placeholder = input<string>(' ');

  /** Shows character count for add-task title input. */
  public readonly showCharCount = input(false, { transform: booleanAttribute });

  /** Maximum character length for add-task title input. */
  public readonly maxLength = input<number | null>(null);

  /**
   * When `true`, displays the generic default message "This field is required" instead of the field-specific one.
   */
  public readonly requiredMsg = input(false, { transform: booleanAttribute });

  /** Autocomplete attribute for the input element. Standard is `'off'`. */
  public readonly autocomplete = input<string>('off');

  /** Active icon state for password fields: `'lock'`, `'password-hidden'`, or `'password-visible'`. */
  protected readonly passwordIcon = signal<'lock' | 'password-hidden' | 'password-visible'>('lock');

  /** Tracks whether the password text is masked by bullet characters. */
  protected readonly passwordHidden = signal<boolean>(true);

  /** Current value displayed in the field. Updated by user input and by `writeValue()`. */
  protected value: string = '';

  /** Real unmasked password string stored internally. */
  /** Stores the unmasked password string in memory when inputType is password. */
  private actualPassword: string = '';

  /** Callback registered by Angular forms; call it to propagate a new value to the form control. */
  private onChange: (value: string) => void = () => {};

  /** Callback registered by Angular forms; called on blur to mark the control as touched. */
  protected onTouched: () => void = () => {};

  /** Registers ControlValueAccessor and initializes reactive control event listeners. */
  constructor() {
    if (this.ngControl) {
      this.ngControl.valueAccessor = this;
    }
    this.initControlEventsEffect();
  }

  /** Checks if the bound form control has a required validator attached. */
  protected isRequired(): boolean {
    const ctrl = this.ngControl?.control;
    return ctrl ? ctrl.hasValidator(Validators.required) : false;
  }

  /**
   * ControlValueAccessor: called by Angular when the form model changes programmatically.
   *
   * @param value - The new model value. `null`/`undefined` are displayed as an empty string.
   */
  public writeValue(value: string): void {
    this.value = value ?? '';
    this.actualPassword = this.value;
    if (this.inputType() === 'password') this.updatePasswordDisplay();
    this.cdr.markForCheck();
  }

  /** ControlValueAccessor: stores callback to report view-to-model value changes. */
  public registerOnChange(fn: (value: string) => void): void {
    this.onChange = fn;
  }

  /** ControlValueAccessor: stores callback to report that the field was blurred. */
  public registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  /**
   * Handles input events for text or password fields and notifies the form control.
   *
   * @param event - The native DOM input event.
   */
  protected onInput(event: Event): void {
    const inputElement = event.target as HTMLInputElement | HTMLTextAreaElement;
    if (this.inputType() === 'password') {
      this.handlePasswordInput(inputElement as HTMLInputElement);
    } else {
      this.value = inputElement.value;
      this.onChange(this.value);
    }
  }

  /** Toggles password visibility between masked characters and plain text. */
  protected togglePasswordHidden(): void {
    this.passwordHidden.update((hidden) => !hidden);
    this.updatePasswordDisplay();
  }

  /**
   * Returns the error message to display below the field.
   *
   * @returns Validation error message string, or `null` if valid/untouched.
   */
  protected showError(): string | null {
    const ctrl = this.ngControl.control;
    if (!ctrl || !ctrl.invalid || !ctrl.touched) return null;

    const errors =
      this.requiredMsg() && ctrl.errors?.['required'] ? { requiredDefault: true } : ctrl.errors;
    return this.errorService.getErrorMessage(errors, this.label() ?? '');
  }

  /** Subscribes to FormControl events to refresh error display. */
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

  /** Processes password keystrokes, updates internal secret and masked display value. */
  private handlePasswordInput(inputElement: HTMLInputElement): void {
    const cursor = inputElement.selectionStart ?? inputElement.value.length;
    this.applyPasswordEdit(
      inputElement.value.length,
      this.actualPassword.length,
      cursor,
      inputElement.value,
    );
    this.updatePasswordDisplay(cursor, inputElement);
    this.onChange(this.actualPassword);
  }

  /** Slices added or deleted characters into the internal actualPassword buffer. */
  private applyPasswordEdit(newLen: number, oldLen: number, cursor: number, val: string): void {
    if (newLen < oldLen) {
      const deletedCount = oldLen - newLen;
      this.actualPassword =
        this.actualPassword.slice(0, cursor) + this.actualPassword.slice(cursor + deletedCount);
    } else if (newLen > oldLen) {
      const addedCount = newLen - oldLen;
      const addedText = val.slice(cursor - addedCount, cursor);
      this.actualPassword =
        this.actualPassword.slice(0, cursor - addedCount) +
        addedText +
        this.actualPassword.slice(cursor - addedCount);
    }
  }

  /** Refreshes masked password display characters and selection cursor. */
  private updatePasswordDisplay(cursor?: number, inputElement?: HTMLInputElement): void {
    this.computePasswordDisplayState();
    if (inputElement) {
      inputElement.value = this.value;
      if (cursor !== undefined) {
        inputElement.setSelectionRange(cursor, cursor);
      }
    }
  }

  /** Computes masked string and active icon based on actual password length and hidden flag. */
  private computePasswordDisplayState(): void {
    if (this.actualPassword.length === 0) {
      this.value = '';
      this.passwordIcon.set('lock');
    } else if (this.passwordHidden()) {
      this.value = '∗'.repeat(this.actualPassword.length);
      this.passwordIcon.set('password-hidden');
    } else {
      this.value = this.actualPassword;
      this.passwordIcon.set('password-visible');
    }
  }
}
