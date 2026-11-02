import { Component, input, output, inject } from '@angular/core';
import { TaskInterface } from '../../../../../interfaces/task.interface';
import { TaskCard } from '../../../../../shared/task-card/task-card';
import { Buttons } from '../../../../../shared/button.component/button.component';
import { CdkDrag, CdkDragStart } from '@angular/cdk/drag-drop';
import { DialogService } from '../../../../../services/dialog.service';
import { TaskService } from '../../../../../services/task.service';

/**
 * One column of the board (e.g. "To do"): title, button to add a task
 * and the cards of all tasks with this status.
 * Shows a hint if the column has no tasks.
 *
 * @example
 * <app-board-column status="To do" [tasks]="todoTasks" />
 */
@Component({
  imports: [Buttons, TaskCard, CdkDrag],
  selector: 'app-board-column',
  styleUrl: './board-column.scss',
  templateUrl: './board-column.html',
})
export class BoardColumn {
  /** Status of the column, also used as its title (e.g. "To do"). */
  status = input.required<TaskInterface['status']>();

  /** Tasks that are shown in this column. */
  tasks = input.required<TaskInterface[]>();

  /** Shows a dashed drop hint at the end of the column. default = false */
  showDropHint = input(false);

  /** Emits the size (px) of the pressed card. */
  cardPressed = output<{ width: number; height: number }>();

  /** Size (px)  of the drop hint, same as the pressed card. */
  dropHintSize = input({ width: 0, height: 0 });

  /** Opens the global dialog (same service as in the board header). */
  dialogService = inject(DialogService);

  taskService = inject(TaskService);

  /** Measures the pressed card and passes its height to the container. */
  onCardPressed(event: PointerEvent) {
    const card = event.currentTarget as HTMLElement;
    this.cardPressed.emit({ width: card.offsetWidth, height: card.offsetHeight });
  }

  /** Measures the dragged card and passes its size to the container once dragging starts. */
  onDragStarted(event: CdkDragStart) {
    const card = event.source.getPlaceholderElement();
    this.cardPressed.emit({ width: card.offsetWidth, height: card.offsetHeight });
  }
}
