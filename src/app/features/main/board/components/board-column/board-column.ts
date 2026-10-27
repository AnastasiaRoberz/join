import { Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TaskInterface } from '../../../../../interfaces/task.interface';
import { TaskCard } from '../../../../../shared/task-card/task-card';
import { Buttons } from '../../../../../shared/button.component/button.component';
import { CdkDrag } from '@angular/cdk/drag-drop';

/**
 * One column of the board (e.g. "To do"): title, button to add a task
 * and the cards of all tasks with this status.
 * Shows a hint if the column has no tasks.
 *
 * @example
 * <app-board-column status="To do" [tasks]="todoTasks" />
 */
@Component({
  imports: [RouterLink, Buttons, TaskCard, CdkDrag],
  selector: 'app-board-column',
  styleUrl: './board-column.scss',
  templateUrl: './board-column.html',
})
export class BoardColumn {
  /** Status of the column, also used as its title (e.g. "To do"). */
  status = input.required<TaskInterface['status']>();

  /** Tasks that are shown in this column. */
  tasks = input.required<TaskInterface[]>();
}
