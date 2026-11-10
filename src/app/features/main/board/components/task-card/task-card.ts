import { Component, computed, inject, input, signal } from '@angular/core';
import { TaskInterface } from '../../../../../interfaces/task.interface';
import { AvatarGroupComponent } from '../../../../../shared/avatar-group.component/avatar-group.component';
import { DialogService } from '../../../../../services/dialog.service';
import { TaskService } from '../../../../../services/task.service';
import { CATEGORIES } from '../../../../../utils/categories-list';
import { CursorTooltipDirective } from '../../../../../directives/cursor-tooltip.directive';

/**
 * Shows one task as a card on the board: category, title, description preview,
 * subtask progress, assigned users and priority.
 *
 * @example
 * <app-task-card [task]="task" />
 */
@Component({
  imports: [AvatarGroupComponent, CursorTooltipDirective],
  selector: 'app-task-card',
  styleUrl: './task-card.scss',
  templateUrl: './task-card.html',
  host: { '(document:click)': 'onDocumentClick()' },
})
export class TaskCard {
  /** Dialog service for opening task detail popup upon card click. */
  protected readonly dialogService = inject(DialogService);

  /** Task service for persisting status moves triggered from the card menu. */
  protected readonly taskService = inject(TaskService);

  /** The task that is displayed. Must be provided by the parent. */
  public readonly task = input.required<TaskInterface>();

  /** Whether the mobile column move dropdown menu is open. */
  protected readonly statusMenuOpen = signal<boolean>(false);

  /** Number of all subtasks of the task (0 if there are none). */
  protected readonly totalSubtasks = computed<number>(() => this.task().subtasks?.length ?? 0);

  /** Number of subtasks that are already checked. */
  protected readonly doneSubtasks = computed<number>(
    () => this.task().subtasks?.filter((subtask) => subtask.is_done).length ?? 0,
  );

  /** Background color of the category label, taken from the shared category list. */
  protected readonly categoryColor = computed<string | undefined>(
    () => CATEGORIES.find((category) => category.name === this.task().category)?.color,
  );

  /** Available target column statuses excluding the task's current status. */
  protected readonly targetStatuses = computed<TaskInterface['status'][]>(() => {
    const all: TaskInterface['status'][] = ['To do', 'In progress', 'Await feedback', 'Done'];
    return all.filter((s) => s !== this.task().status);
  });

  /**
   * Toggles the mobile status move dropdown menu.
   *
   * @param event - Mouse or touch click event.
   */
  protected toggleStatusMenu(event: Event): void {
    event.stopPropagation();
    this.statusMenuOpen.update((open) => !open);
  }

  /**
   * Moves the task to a different status column on mobile devices.
   *
   * @param status - Target status column.
   * @param event - Mouse or touch click event.
   */
  protected async moveToStatus(status: TaskInterface['status'], event: Event): Promise<void> {
    event.stopPropagation();
    this.statusMenuOpen.set(false);
    await this.taskService.updateTask(this.task().id, { status });
  }

  /** Closes the mobile move menu when clicking outside. */
  protected onDocumentClick(): void {
    if (this.statusMenuOpen()) {
      this.statusMenuOpen.set(false);
    }
  }
}
