import { Component, inject } from '@angular/core';
import { Buttons } from '../../../../../shared/button.component/button.component';
import { TaskService } from '../../../../../services/task.service';
import { DialogService } from '../../../../../services/dialog.service';
import { TaskInterface } from '../../../../../interfaces/task.interface';
import { SelectFieldComponent } from '../../../../../shared/select-field.component/select-field.component';

/**
 * Header of the board: title, active filter chip, task search bar and the "Add Task" button.
 */
@Component({
  imports: [Buttons, SelectFieldComponent],
  selector: 'app-board-header',
  styleUrl: './board-header.scss',
  templateUrl: './board-header.html',
})
export class BoardHeader {
  /** Provides the tasks for the search bar, the active board filter and `openAddTask()`. */
  protected readonly taskService = inject(TaskService);

  /** Opens the task detail dialog when a task is picked in the search bar. */
  private readonly dialogService = inject(DialogService);

  /** Formats a task option in the search dropdown using its title. */
  protected readonly taskLabelFn = (task: TaskInterface): string => task.title;

  /** Fields matched via `includes` (task title and description). */
  protected readonly taskSearchStrings = (task: TaskInterface): (string | undefined | null)[] => [
    task.title,
    task.description,
  ];

  /**
   * Opens the task detail dialog when a task is selected from the searchbar.
   *
   * @param taskId - Id of the selected task, `null` when the search value was reset.
   */
  protected onTaskSelected(taskId: number | null): void {
    if (!taskId) return;
    const selectedTask = this.taskService.tasks().find((t) => t.id === taskId);
    if (selectedTask) {
      this.dialogService.openDialog('task', selectedTask);
    }
  }
}
