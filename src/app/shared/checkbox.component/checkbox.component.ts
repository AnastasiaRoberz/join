import { Component, computed, contentChild, effect, inject, input, model } from '@angular/core';
import { ControlValueAccessor, NgControl } from '@angular/forms';
import { ErrorService } from '../../services/error.service';

/** Global counter used to generate unique DOM IDs for checkbox instances. */
let nextId = 0;

/**
 * Reusable custom checkbox component that supports both standalone reactive binding
 * via `[(checked)]` / `[checked]` + `(checkedChange)` and Angular FormControl projection via `NgControl`.
 *
 * ### Usage modes
 * - **Standalone**: bind `[(checked)]` (two-way) or `[checked]` + `(checkedChange)`. The native
 *   `<input type="checkbox">` is hidden; the visible box is an SVG icon (`checkbox-checked` / `checkbox-empty`).
 *   A click on the icon toggles `checked` and emits `checkedChange` with the new boolean.
 * - **With a projected `NgControl`**: if the content contains a form control directive
 *   (`formControlName` / `formControl` / `ngModel`), its value is bidirectionally synchronized.
 *   User interactions update the model and notify the form control via `onChange`.
 *
 * The host element gets the CSS class `selected` while `checked()` is `true`.
 *
 * Automatically adapts its visual layout:
 * - **With label (`[text]`)**: Renders an interactive row with strikethrough styling when checked (e.g., subtasks).
 * - **Icon-only (`!text()`)**: Renders just the checkbox icon for compact placement inside lists/dropdowns.
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
 * ### 3. Two-way binding
 * ```html
 * <app-checkbox text="Remember me" [(checked)]="rememberMe" />
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
  /** Service used to format form validation error messages when bound to an `NgControl`. */
  private readonly errorService = inject(ErrorService);

  // ---------------------------------------------------------------------------
  // Content Queries, Inputs & Models
  // ---------------------------------------------------------------------------

  /** Optional projected `NgControl` when used inside a reactive form wrapper. */
  public readonly ngControl = contentChild(NgControl);

  /** Callback registered by Angular Forms to propagate value changes. */
  private onChange: (value: boolean) => void = () => {};

  /** Callback registered by Angular Forms to propagate touch events. */
  private onTouched: () => void = () => {};

  /**
   * Unique HTML id attribute for the native (hidden) checkbox input element.
   * Defaults to an auto-generated `app-checkbox-<n>`.
   */
  public readonly fieldId = input<string>(`app-checkbox-${nextId++}`);

  /**
   * Optional text label displayed next to the checkbox icon (rendered in a `<span>`).
   */
  public readonly text = input<string | null>(null);

  /**
   * Two-way bindable checked state.
   * Automatically exposes both `[checked]` input and `(checkedChange)` output.
   */
  public readonly checked = model<boolean>(false);

  // ---------------------------------------------------------------------------
  // Computed Signals
  // ---------------------------------------------------------------------------

  /** SVG sprite path corresponding to the current `checked()` state. */
  protected readonly iconHref = computed<string>(() =>
    this.checked()
      ? './assets/icons/icons.svg#checkbox-checked'
      : './assets/icons/icons.svg#checkbox-empty',
  );

  /** Initializes reactive synchronization between the checkbox state and NgControl. */
  constructor() {
    this.initNgControlSyncEffect();
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
   * and emits the new boolean value via `(checkedChange)`.
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
   * Returns a human-readable validation error message if a projected `NgControl`
   * is invalid and has been touched by the user.
   *
   * @returns The formatted error message string, or `null` if valid/untouched.
   */
  public showError(): string | null {
    const ctrl = this.ngControl()?.control;
    if (!ctrl || !ctrl.invalid || !ctrl.touched) return null;

    return this.errorService.getErrorMessage(ctrl.errors, '');
  }

  /**
   * Synchronizes the `checked` state with a projected `NgControl` (if present).
   */
  private initNgControlSyncEffect(): void {
    effect((onCleanUp) => {
      const ctrl = this.ngControl()?.control;
      if (ctrl) {
        this.checked.set(Boolean(ctrl.value));
        const sub = ctrl.valueChanges.subscribe((value) => {
          this.checked.set(Boolean(value));
        });
        onCleanUp(() => sub.unsubscribe());
      }
    });
  }
}
