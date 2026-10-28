import {
  Component,
  computed,
  contentChild,
  effect,
  inject,
  input,
  model,
} from '@angular/core';
import { NgControl } from '@angular/forms';
import { ErrorService } from '../../services/error.service';

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
 *   (`formControlName` / `formControl` / `ngModel`), its `FormControl` value is mirrored into `checked`
 *   (initially and on every `valueChanges`). This sync is one-way (control → checkbox): user clicks update
 *   `checked` / `checkedChange`, but are not written back to the control by this component.
 *   Note that the template has no `<ng-content>`, so projected content is never rendered.
 *
 * The host element gets the CSS class `selected` while `checked()` is `true`
 * (this is what applies the strikethrough to the text label).
 *
 * Automatically adapts its visual layout:
 * - **With label (`[text]`)**: Renders an interactive row with strikethrough styling when checked (e.g., subtasks).
 * - **Icon-only (`!text()`)**: Applies the `.onlyIcon` host class for compact placement inside lists/dropdowns.
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
 * Here `toggleSubtaskStatus(subtaskId: number, isDone: boolean)` receives the id of the subtask
 * and the new checked state (`$event`).
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
    '[class.onlyIcon]': '!text()',
    '[class.selected]': 'checked()',
  },
})
export class CheckboxComponent {
  /** Service used to format form validation error messages when bound to an `NgControl`. */
  errorService = inject(ErrorService);

  // ---------------------------------------------------------------------------
  // Content Queries, Inputs & Models
  // ---------------------------------------------------------------------------

  /** Optional projected `NgControl` when used inside a reactive form wrapper. */
  ngControl = contentChild(NgControl);

  /**
   * Unique HTML id attribute for the native (hidden) checkbox input element.
   * Defaults to an auto-generated `app-checkbox-<n>`.
   */
  id = input<string>(`app-checkbox-${nextId++}`);

  /**
   * Optional text label displayed next to the checkbox icon (rendered in a `<span>`).
   * If empty, the host gets the `.onlyIcon` class for the compact icon-only appearance.
   */
  text = input<string | null>(null);

  /**
   * Two-way bindable checked state.
   * Automatically exposes both `[checked]` input and `(checkedChange)` output.
   */
  checked = model<boolean>(false);

  // ---------------------------------------------------------------------------
  // Computed Signals
  // ---------------------------------------------------------------------------

  /** SVG sprite path corresponding to the current `checked()` state. */
  iconHref = computed(() =>
    this.checked()
      ? './assets/icons/icons.svg#checkbox-checked'
      : './assets/icons/icons.svg#checkbox-empty',
  );

  /**
   * Synchronizes the `checked` state with a projected `NgControl` (if present).
   * Reads the control's current value as a boolean and subscribes to its `valueChanges`;
   * the subscription is cleaned up whenever the effect re-runs or the component is destroyed.
   * Without a projected control this effect does nothing.
   */
  constructor() {
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

  // ---------------------------------------------------------------------------
  // Event Handlers & Public Methods
  // ---------------------------------------------------------------------------

  /**
   * Handles native checkbox input changes, updates the `checked` model,
   * and emits the new boolean value via `(checkedChange)`.
   * Bound to the `(change)` event of the wrapping `<label>` (the native `change` event bubbles up from the hidden input).
   *
   * @param event - The DOM `change` event triggered by the checkbox input.
   */
  onInputChange(event: Event): void {
    const target = event.target as HTMLInputElement;
    if (target) {
      this.checked.set(target.checked);
    }
  }

  /**
   * Returns a human-readable validation error message if a projected `NgControl`
   * is invalid and has been touched by the user.
   *
   * Message text is produced by `ErrorService.getErrorMessage()`.
   *
   * @returns The formatted error message string, or `null` if valid/untouched (or no control is projected).
   */
  showError(): string | null {
    const ctrl = this.ngControl()?.control;
    if (!ctrl || !ctrl.invalid || !ctrl.touched) return null;

    return this.errorService.getErrorMessage(ctrl.errors, '');
  }
}
