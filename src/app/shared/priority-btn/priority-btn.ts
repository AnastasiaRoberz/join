import { Component, inject, signal } from '@angular/core';
import { ControlValueAccessor, NgControl } from '@angular/forms';

/**
 * Available priority levels of a task.
 * Matches the database schema and {@link TaskInterface.priority}.
 */
export type Priority = 'urgent' | 'medium' | 'low';

/**
 * Configuration interface describing the visual and functional properties of a single priority button.
 */
export interface PriorityOption {
  /** The technical priority value used for storage and styling. */
  value: Priority;
  /** Human-readable display label. */
  label: string;
  /** SVG symbol identifier referencing the icon sprite (e.g. 'urgent', 'medium', 'low'). */
  icon: string;
}

/**
 * Predefined list of selectable priority options including labels and sprite icon IDs.
 */
export const PRIORITY_OPTIONS: PriorityOption[] = [
  {
    value: 'urgent',
    label: 'Urgent',
    icon: 'urgent',
  },
  {
    value: 'medium',
    label: 'Medium',
    icon: 'medium',
  },
  {
    value: 'low',
    label: 'Low',
    icon: 'low',
  },
];

/**
 * Reusable priority selector component containing all three priority options (Urgent, Medium, Low).
 *
 * Implements Angular's {@link ControlValueAccessor} so it can be seamlessly used within
 * Reactive Forms via `formControlName` or `[formControl]`. The component injects its own
 * {@link NgControl} and registers itself as the value accessor in the constructor, allowing
 * bidirectional communication with the parent form control.
 *
 * Visual selection state is managed via an internal signal (`activePriority`), which is kept in
 * sync with programmatic form updates via {@link writeValue} and user interaction via
 * {@link selectPriority}.
 *
 * @example
 * ```html
 * <!-- Inside a Reactive Form -->
 * <form [formGroup]="taskForm">
 *   <app-priority-btn formControlName="priority" />
 * </form>
 * ```
 */
@Component({
  imports: [],
  selector: 'app-priority-btn',
  styleUrl: './priority-btn.scss',
  templateUrl: './priority-btn.html',
})
export class PriorityBtn implements ControlValueAccessor {
  /**
   * The list of available priority options rendered by the template.
   */
  readonly priorities = PRIORITY_OPTIONS;

  /**
   * Internal signal tracking the currently active priority level for template rendering and class binding.
   * Defaults to `'medium'`.
   */
  activePriority = signal<Priority>('medium');

  /**
   * Injected {@link NgControl} binding this component to the parent Angular form control directive.
   */
  private ngControl = inject(NgControl, { optional: true });

  /**
   * Callback registered by Angular Forms; invoked to propagate new priority values to the bound form control.
   */
  private onChange: (value: Priority) => void = () => {};

  /**
   * Callback registered by Angular Forms; invoked to mark the bound form control as touched on user interaction.
   */
  private onTouched: () => void = () => {};

  /**
   * Registers this component as the value accessor of its bound {@link NgControl}.
   */
  constructor() {
    if (this.ngControl) {
      this.ngControl.valueAccessor = this;
    }
  }

  // ---------------------------------------------------------------------------
  // ControlValueAccessor Implementation
  // ---------------------------------------------------------------------------

  /**
   * Writes a new priority value from the Angular form model into the component view.
   * Called by Angular Forms when the control value is updated programmatically
   * (e.g. `setValue()`, `patchValue()`, or `reset()`).
   *
   * @param value - The priority value from the form model (`'urgent'`, `'medium'`, `'low'`).
   */
  writeValue(value: Priority): void {
    if (value) {
      this.activePriority.set(value);
    }
  }

  /**
   * Registers the callback function that Angular Forms invokes when the control value changes.
   *
   * @param fn - The callback receiving the updated {@link Priority}.
   */
  registerOnChange(fn: (value: Priority) => void): void {
    this.onChange = fn;
  }

  /**
   * Registers the callback function that Angular Forms invokes when the control is touched/blurred.
   *
   * @param fn - The callback notifying Angular Forms that the control was touched.
   */
  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  // ---------------------------------------------------------------------------
  // User Interaction Handlers
  // ---------------------------------------------------------------------------

  /**
   * Updates the selected priority when the user clicks a priority button.
   * Sets the internal signal, emits the value to the parent form control via `onChange`,
   * and marks the control as touched.
   *
   * @param prio - The chosen {@link Priority} level.
   */
  selectPriority(prio: Priority): void {
    this.activePriority.set(prio);
    this.onChange(prio);
    this.onTouched();
  }
}
