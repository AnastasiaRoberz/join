import { Component, computed, inject } from '@angular/core';
import { TaskInterface } from '../../../interfaces/task.interface';
import { TaskService } from '../../../services/task.service';
import { BoardColumn } from './components/board-column/board-column';
import { BoardHeader } from './components/board-header/board-header';

/** Status of each board column, in the order the columns are shown. */
const COLUMN_STATUSES: TaskInterface['status'][] = [
  'To do',
  'In progress',
  'Await feedback',
  'Done',
];

/**
 * Board page: the board header and the four columns with the tasks
 * of the `TaskService`, sorted by their status.
 */
@Component({
  imports: [BoardHeader, BoardColumn],
  selector: 'app-board',
  styleUrl: './board.scss',
  templateUrl: './board.html',
})
export class Board {
  taskService = inject(TaskService);

  /**
   * The columns of the board, each with the tasks that have its status.
   * Recalculates automatically when the tasks in the service change.
   */
  columns = computed(() => {
    const tasks = this.taskService.tasks();
    return COLUMN_STATUSES.map((status) => ({
      status,
      tasks: tasks.filter((task) => task.status === status),
    }));
  });
}