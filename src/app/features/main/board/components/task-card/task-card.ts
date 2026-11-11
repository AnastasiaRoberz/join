import { Component, computed, inject, input, signal } from '@angular/core';
import { TaskInterface } from '../../../../../interfaces/task.interface';
import { AvatarGroupComponent } from '../../../../../shared/avatar-group.component/avatar-group.component';
import { DialogService } from '../../../../../services/dialog.service';
import { TaskService } from '../../../../../services/task.service';
import { CATEGORIES } from '../../../../../utils/categories-list';

/**
 * Shows one task as a card on the board: category, title, description preview,
 * subtask progress, assigned users and priority.
 *
 * @example
 * <app-task-card [task]="task" />
 */
@Component({
  imports: [AvatarGroupComponent],
  selector: 'app-task-card',
  styleUrl: './task-card.scss',
  templateUrl: './task-card.html',
})
export class TaskCard {
  /** Dialog service for opening task detail popup upon card click. */
  protected readonly dialogService = inject(DialogService);

  /** Task service for persisting status moves triggered from the card menu. */
  protected readonly taskService = inject(TaskService);

  /** The task that is displayed. Must be provided by the parent. */
  public readonly task = input.required<TaskInterface>();

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
}
