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
 * and interactive subtasks.
 */
@Component({
  imports: [Buttons, UserAvatar, CheckboxComponent, DatePipe],
  selector: 'app-task-details',
  styleUrl: './task-details.scss',
  templateUrl: './task-details.html',
})
export class TaskDetails {
  /** Provides reactive access to the task collection and subtask mutation methods. */
  taskService = inject(TaskService);

  /** Manages closing the detail modal or switching to the `task-edit` dialog. */
  dialogService = inject(DialogService);

  /** Helper function exposed to the template for formatting priority labels. */
  capitalizeFirstLetter = capitalizeFirstLetter;

  // ---------------------------------------------------------------------------
  // Inputs & Computed State
  // ---------------------------------------------------------------------------

  /** Fallback task ID if no task object was passed via `DialogService.openDialog()`. */
  selectedId = input<number>(1);

  /**
   * Reactively resolves the full task object from `TaskService` matching the task
   * stored in `dialogService.selectedItem()` (or falls back to `selectedId()`).
   * Automatically reflects live changes when subtasks or task details are updated.
   */
  selectedTask = computed(() => {
    const targetId = this.dialogService.selectedItem()?.id ?? this.selectedId();
    return this.taskService.tasks().find((task) => task.id === targetId);
  });

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
   * Toggles the completion status (`is_done`) of a specific subtask and persists it via `TaskService`.
   *
   * @param subtaskId - The ID of the subtask being toggled.
   * @param taskId - The ID of the parent task.
   * @param isDone - The new completion state emitted by `<app-checkbox>`.
   */
  async toggleSubtaskStatus(subtaskId: number, isDone: boolean): Promise<void> {
    await this.taskService.updateSubtaskStatus(subtaskId, isDone);
  }
}
