import { Component, computed, inject } from '@angular/core';
import { TaskInterface } from '../../../../../interfaces/task.interface';
import { TaskService } from '../../../../../services/task.service';
import { BoardColumn } from '../board-column/board-column';
import { CdkDrag, CdkDropList, CdkDropListGroup } from '@angular/cdk/drag-drop';

/** Status of each board column, in the order the columns are shown. */
const COLUMN_STATUSES: TaskInterface['status'][] = [
  'To do',
  'In progress',
  'Await feedback',
  'Done',
];

@Component({
  selector: 'app-board-container',
  imports: [BoardColumn, CdkDropListGroup],
  templateUrl: './board-container.html',
  styleUrl: './board-container.scss',
})
export class BoardContainer {
  taskService = inject(TaskService);

  columns = computed(() => {
    const tasks = this.taskService.tasks();
    return COLUMN_STATUSES.map((status) => ({
      status,
      tasks: tasks.filter((task) => task.status === status),
    }));
  });
}
