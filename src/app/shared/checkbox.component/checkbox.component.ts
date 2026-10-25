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
 *   (checkedChange)="toggleSubtaskStatus(subtask.id, task.id, $event)"
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

  /** Unique HTML id attribute for the native checkbox input element. */
  id = input<string>(`app-checkbox-${nextId++}`);

  /** Optional text label displayed next to the checkbox icon. */
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
   * @returns The formatted error message string, or `null` if valid/untouched.
   */
  showError(): string | null {
    const ctrl = this.ngControl()?.control;
    if (!ctrl || !ctrl.invalid || !ctrl.touched) return null;

    return this.errorService.getErrorMessage(ctrl.errors, '');
  }
}
