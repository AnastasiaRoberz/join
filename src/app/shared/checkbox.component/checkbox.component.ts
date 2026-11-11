import {
  booleanAttribute,
  ChangeDetectorRef,
  Component,
  computed,
  effect,
  inject,
  input,
  model,
} from '@angular/core';
import { ControlValueAccessor, NgControl } from '@angular/forms';
import { ErrorService } from '../../services/error.service';

/** Global counter used to generate unique DOM IDs for checkbox instances. */
let nextId = 0;

/**
 * Reusable custom checkbox component that supports both standalone reactive binding
 * via `[(checked)]` / `[checked]` + `(checkedChange)` and Angular FormControl binding via `NgControl`.
 *
 * ### Usage modes
 * - **Standalone**: bind `[(checked)]` (two-way) or `[checked]` + `(checkedChange)`. The native
 *   `<input type="checkbox">` is hidden; the visible box is an SVG icon (`checkbox-checked` / `checkbox-empty`).
 *   A click on the icon toggles `checked` and emits `checkedChange` with the new boolean.
 * - **With `NgControl` (`formControlName` / `formControl`)**: implements `ControlValueAccessor`.
 *   Synchronizes with the form control state, validates against attached validators, and displays
 *   validation errors via {@link ErrorService}.
 *
 * The host element gets the CSS class `selected` while `checked()` is `true`.
 *
 * Automatically adapts its visual layout:
 * - **With label (`[text]`)**: Renders an interactive row with strikethrough styling when checked (e.g., subtasks).
 * - **With projected content (`<ng-content />`)**: Renders arbitrary rich HTML next to the checkbox icon (e.g. links).
 * - **Icon-only (`!text()` & no content)**: Renders just the checkbox icon for compact placement inside lists/dropdowns.
 *
 * @example
 * ### 1. Standalone with label (Subtasks)
 * ```html
 * <app-checkbox
 *   [text]="subtask.title"
 *   [checked]="subtask.is_done"
 *   (checkedChange)="toggleSubtaskStatus(subtask.id, $event)"
 * />
 * ```
 *
 * @example
 * ### 2. Icon-only inside a select option
 * ```html
 * <app-checkbox
 *   [checked]="selected"
 *   (checkedChange)="toggleAssignment(contact.id, $event)"
 * />
 * ```
 *
 * @example
 * ### 3. Reactive Form with validation error message
 * ```html
 * <app-checkbox
 *   fieldId="privacy"
 *   formControlName="privacy"
 *   label="Privacy policy"
 *   requiredMsg
 * >
 *   <label for="privacy">
 *     I accept the <a routerLink="/app/privacy-policy">Privacy policy</a>
 *   </label>
 * </app-checkbox>
 * ```
 */
@Component({
  imports: [],
  selector: 'app-checkbox',
  styleUrl: './checkbox.component.scss',
  templateUrl: './checkbox.component.html',
  host: {
    '[class.selected]': 'checked()',
  },
})
export class CheckboxComponent implements ControlValueAccessor {
  /** Service providing localized form validation error messages. */
  private readonly errorService = inject(ErrorService);

  /** Change detector reference used to trigger view updates on control events. */
  private readonly cdr = inject(ChangeDetectorRef);

  /** Optional injected `NgControl` directive binding this component to an Angular form control. */
  private readonly ngControl = inject(NgControl, { optional: true });

  // ---------------------------------------------------------------------------
  // Inputs & Models
  // ---------------------------------------------------------------------------

  /**
   * Unique HTML id attribute for the native (hidden) checkbox input element.
   * Defaults to an auto-generated `app-checkbox-<n>`.
   */
  public readonly fieldId = input<string>(`app-checkbox-${nextId++}`);

  /**
   * Optional text label displayed next to the checkbox icon.
   */
  public readonly text = input<string | null>(null);

  /**
   * Field label passed to {@link ErrorService} for generating validation messages.
   */
  public readonly label = input<string>();

  /**
   * When `true`, displays the generic default message "This field is required" instead of the field-specific one.
   */
  public readonly requiredMsg = input(false, { transform: booleanAttribute });

  /**
   * Two-way bindable checked state.
   * Automatically exposes both `[checked]` input and `(checkedChange)` output.
   */
  public readonly checked = model<boolean>(false);

  /** Callback registered by Angular Forms to propagate value changes. */
  private onChange: (value: boolean) => void = () => {};

  /** Callback registered by Angular Forms to propagate touch events. */
  private onTouched: () => void = () => {};

  // ---------------------------------------------------------------------------
  // Computed Signals
  // ---------------------------------------------------------------------------

  /** SVG sprite path corresponding to the current `checked()` state. */
  protected readonly iconHref = computed<string>(() =>
    this.checked()
      ? './assets/icons/icons.svg#checkbox-checked'
      : './assets/icons/icons.svg#checkbox-empty',
  );

  /** Registers ControlValueAccessor and initializes reactive control event listeners. */
  constructor() {
    if (this.ngControl) {
      this.ngControl.valueAccessor = this;
    }
    this.initControlEventsEffect();
  }

  // ---------------------------------------------------------------------------
  // ControlValueAccessor Implementation
  // ---------------------------------------------------------------------------

  /**
   * Writes a new boolean value from the form model into the component.
   *
   * @param value - The boolean checked state.
   */
  public writeValue(value: boolean): void {
    this.checked.set(Boolean(value));
    this.cdr.markForCheck();
  }

  /**
   * Registers the callback function to notify Angular Forms of value changes.
   *
   * @param fn - The change notification callback.
   */
  public registerOnChange(fn: (value: boolean) => void): void {
    this.onChange = fn;
  }

  /**
   * Registers the callback function to notify Angular Forms of touched events.
   *
   * @param fn - The touched notification callback.
   */
  public registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  // ---------------------------------------------------------------------------
  // Event Handlers & Public Methods
  // ---------------------------------------------------------------------------

  /**
   * Handles native checkbox input changes, updates the `checked` model,
   * notifies Angular forms via `onChange`/`onTouched`, and emits `(checkedChange)`.
   *
   * @param event - The DOM `change` event triggered by the checkbox input.
   */
  protected onInputChange(event: Event): void {
    const target = event.target as HTMLInputElement;
    if (target) {
      this.checked.set(target.checked);
      this.onChange(target.checked);
      this.onTouched();
    }
  }

  /**
   * Returns the error message to display below the field.
   *
   * @returns Validation error message string, or `null` if valid/untouched.
   */
  protected showError(): string | null {
    const ctrl = this.ngControl?.control;
    if (!ctrl || !ctrl.invalid || !ctrl.touched) return null;

    const errors =
      this.requiredMsg() && ctrl.errors?.['required'] ? { requiredDefault: true } : ctrl.errors;
    return this.errorService.getErrorMessage(errors, this.label() ?? '');
  }

  /**
   * Subscribes to form control events (status/touch changes) to refresh validation error display.
   */
  private initControlEventsEffect(): void {
    effect((onCleanUp) => {
      const ctrl = this.ngControl?.control;
      if (ctrl) {
        const sub = ctrl.events.subscribe(() => {
          this.cdr.markForCheck();
        });
        onCleanUp(() => sub.unsubscribe());
      }
    });
  }
}
