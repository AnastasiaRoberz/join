import { Component, inject, signal } from '@angular/core';
import { Buttons } from '../../../../../shared/button.component/button.component';
import { ResponsiveService } from '../../../../../services/responsive.service';
import { TaskService } from '../../../../../services/task.service';
import { DialogService } from '../../../../../services/dialog.service';
import { TaskInterface } from '../../../../../interfaces/task.interface';
import { SelectFieldComponent } from '../../../../../shared/select-field.component/select-field.component';

@Component({
  imports: [Buttons, SelectFieldComponent],
  selector: 'app-board-header',
  styleUrl: './board-header.scss',
  templateUrl: './board-header.html',
  host: {
    '[class.is-mobile]': 'responsiveService.isMobile()',
  },
})
export class BoardHeader {
  responsiveService = inject(ResponsiveService);
  taskService = inject(TaskService);
  dialogService = inject(DialogService);
  exTask = signal<TaskInterface | null>(null);

  /** Formats a task option in the search dropdown using its title. */
  taskLabelFn = (task: TaskInterface): string => task.title;

  /** Fields matched via `startsWith` (task title). */
  taskTitleSearch = (task: TaskInterface): string[] => [task.title];

  /** Fields matched via `includes` (task description). */
  taskDescriptionSearch = (task: TaskInterface): (string | undefined | null)[] => [
    task.description,
  ];

  constructor() {
    this.getTask();
  }

  async getTask() {
    const task = await this.taskService.getOneTask(7);
    this.exTask.set(task);
  }

  /** Opens the task detail dialog when a task is selected from the searchbar. */
  onTaskSelected(taskId: number | null): void {
    if (!taskId) return;
    const selectedTask = this.taskService.tasks().find((t) => t.id === taskId);
    if (selectedTask) {
      this.dialogService.openDialog('task', selectedTask);
    }
  }
}
