import { Component, computed, input } from '@angular/core';
import { TaskInterface } from '../../interfaces/task.interface';
import { AvatarGroupComponent } from '../avatar-group.component/avatar-group.component';
import { CATEGORIES } from '../../utils/categories-list';

/**
 * Shows one task as a card on the board: category, title, description preview,
 * subtask progress, assigned users and priority.
 *
 * Presentational component: it only displays the task it receives.
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
  /** The task that is displayed. Must be provided by the parent. */
  task = input.required<TaskInterface>();

  /** Number of all subtasks of the task (0 if there are none). */
  totalSubtasks = computed(() => this.task().subtasks?.length ?? 0);

  /** Number of subtasks that are already checked. */
  doneSubtasks = computed(
    () => this.task().subtasks?.filter((subtask) => subtask.is_done).length ?? 0,
  );

  /** Progress of the subtasks in percent (0 if there are no subtasks). */
  progress = computed(() => {
    const total = this.totalSubtasks();
    return total ? (this.doneSubtasks() / total) * 100 : 0;
  });

  /** Background color of the category label, taken from the shared category list. */
  categoryColor = computed(
    () => CATEGORIES.find((category) => category.name === this.task().category)?.color,
  );
}