import { Component, computed, inject, input } from '@angular/core';
import { DatePipe } from '@angular/common';
import { TaskService } from '../../../../../services/task.service';
import { DialogService } from '../../../../../services/dialog.service';
import { Buttons } from '../../../../../shared/button.component/button.component';
import { UserAvatar } from '../../../../../shared/user-avatar/user-avatar';
import { CheckboxComponent } from '../../../../../shared/checkbox.component/checkbox.component';
import { capitalizeFirstLetter } from '../../../../../utils/utils';

/**
 * Dialog view component that displays the full details of a selected board task,
 * including its category tag, title, description, due date, priority, assigned contacts,
 * and subtasks.
 *
 * The view is read-only except for the subtask checkboxes: toggling a subtask's `is_done`
 * state is persisted immediately (see {@link TaskDetails.toggleSubtaskStatus}). All other
 * changes are made in `TaskEdit`, which is opened via the edit button.
 *
 * It is rendered by `DialogComponent` when `DialogService.dialogType()` is `'task'`:
 *
 * @example
 * ```ts
 * // e.g. from a task card on the board
 * dialogService.openDialog('task', task);
 * ```
 * ```html
 * <app-task-details />
 * ```
 */
@Component({
  imports: [Buttons, UserAvatar, CheckboxComponent, DatePipe],
  selector: 'app-task-details',
  styleUrl: './task-details.scss',
  templateUrl: './task-details.html',
})
export class TaskDetails {
  /** Provides reactive access to the task collection and `updateSubtaskStatus()` for persisting subtask toggles. */
  taskService = inject(TaskService);

  /** Manages closing the detail modal (close button) or switching to the `task-edit` dialog (edit button). */
  dialogService = inject(DialogService);

  /** Helper function exposed to the template for formatting priority labels. */
  capitalizeFirstLetter = capitalizeFirstLetter;

  // ---------------------------------------------------------------------------
  // Inputs & Computed State
  // ---------------------------------------------------------------------------

  /**
   * Fallback task ID (default `1`) used if no task object was passed via `DialogService.openDialog()`.
   * Normally not set, because the dialog container does not bind it.
   */
  selectedId = input<number>(1);

  /**
   * Reactively resolves the full task object from `TaskService` matching the task
   * stored in `dialogService.selectedItem()` (or falls back to `selectedId()`).
   * Automatically reflects live changes when subtasks or task details are updated.
   * Resolves to `undefined` if no matching task exists (the template then renders nothing).
   */
  selectedTask = computed(() => {
    const targetId = this.dialogService.selectedItem()?.id ?? this.selectedId();
    return this.taskService.tasks().find((task) => task.id === targetId);
  });

  /**
   * Subtasks of `selectedTask()` in display order (the source array is not mutated):
   * open subtasks first, completed ones last; within each group the newest subtask
   * (highest id) comes first.
   */
  sortedSubtasks = computed(() => {
    const currentSubtasks = this.selectedTask()?.subtasks ?? [];
    return [...currentSubtasks].sort((a, b) => {
      if (a.is_done !== b.is_done) {
        return a.is_done ? 1 : -1;
      }
      return b.id - a.id;
    });
  });

  // ---------------------------------------------------------------------------
  // Public Methods
  // ---------------------------------------------------------------------------

  /**
   * Persists the completion status (`is_done`) of a single subtask immediately via
   * `TaskService.updateSubtaskStatus`. This is the only change in this view that is saved right away.
   *
   * @param subtaskId - The ID of the subtask being toggled.
   * @param isDone - The new completion state emitted by `<app-checkbox>` (`checkedChange`).
   * @returns A promise that resolves once the update has been completed.
   */
  async toggleSubtaskStatus(subtaskId: number, isDone: boolean): Promise<void> {
    await this.taskService.updateSubtaskStatus(subtaskId, isDone);
  }
}
