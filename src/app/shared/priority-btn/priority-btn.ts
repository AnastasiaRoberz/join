import { Component, computed, HostBinding, HostListener, input, output } from '@angular/core';

// example: <button priority="urgent"></button>

/**
 * Available priority levels of a task.
 */
export type Priority = 'urgent' | 'medium' | 'low';

/**
 * Selectable priority button.
 *
 * Uses the attribute selector `button[priority]`, so it is applied to a native
 * `<button>` element. The label and icon are derived from the required `priority` input.
 *
 * @example
 * <button priority="urgent" [isActive]="selected === 'urgent'" (prioSelected)="onSelect($event)"></button>
 */
@Component({
  imports: [],
  selector: 'button[priority]', //selector umbenannt, Nutzung über button und Attribut, siehe oben example
  styleUrl: './priority-btn.scss',
  templateUrl: './priority-btn.html',
})
export class PriorityBtn {
  /**
   * The priority this button represents. Required when using the component.
   */
  priority = input.required<Priority>();

  /**
   * Whether this button is currently selected. Controls the `active` CSS class.
   */
  isActive = input<boolean>(false);

  /**
   * Emits the button's priority when it is clicked.
   */
  prioSelected = output<Priority>();

  /**
   * Adds the CSS class `active` to the host element while `isActive()` is `true`.
   *
   * @returns `true` if the button is active
   */
  @HostBinding('class.active')
  get activeClass() {
    return this.isActive();
  }

  /**
   * Label and icon for the current priority, used by the template.
   */
  preset = computed(() => {
    const presets = {
      urgent: { label: 'Urgent', icon: 'urgent' },
      medium: { label: 'Medium', icon: 'medium' },
      low: { label: 'Low', icon: 'low' },
    };
    return presets[this.priority()];
  });

  /**
   * Emits `prioSelected` with the button's priority on click.
   */
  @HostListener('click')
  onClick(): void {
    this.prioSelected.emit(this.priority());
  }
}
