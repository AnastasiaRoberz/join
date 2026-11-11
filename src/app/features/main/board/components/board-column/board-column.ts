import {
  Component,
  input,
  output,
  inject,
  ElementRef,
  viewChild,
  afterRenderEffect,
} from '@angular/core';
import { TaskInterface } from '../../../../../interfaces/task.interface';
import { TaskCard } from '../task-card/task-card';
import { Buttons } from '../../../../../shared/button.component/button.component';
import { CdkDrag, CdkDragStart } from '@angular/cdk/drag-drop';
import { TaskService } from '../../../../../services/task.service';
import { ResponsiveService } from '../../../../../services/responsive.service';

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
  host: { role: 'listitem' },
})
export class BoardColumn {
  /** Status of the column, also used as its title (e.g. "To do"). */
  public readonly status = input.required<TaskInterface['status']>();

  /** Tasks that are shown in this column. */
  public readonly tasks = input.required<TaskInterface[]>();

  /** Shows a dashed drop hint at the end of the column. Defaults to false. */
  public readonly showDropHint = input<boolean>(false);

  /** Size (px) of the drop hint, matching the pressed card. */
  public readonly dropHintSize = input<{ width: number; height: number }>({ width: 0, height: 0 });

  /** Emits the size (px) of the dragged card to the board container. */
  public readonly cardPressed = output<{ width: number; height: number }>();

  /** Task service used to open the add task dialog with the current column's status. */
  protected readonly taskService = inject(TaskService);

  /** Provides responsive layout information for drag boundaries. */
  protected readonly responsiveService = inject(ResponsiveService);

  /** The scrollable card list of this column (the `.tasks` div). */
  private readonly taskList = viewChild.required<ElementRef<HTMLElement>>('taskList');

  /** Scrolls this column to the top when a new task is added to it. */
  private readonly scrollToTop = afterRenderEffect(() => {
    const added = this.taskService.lastAddedTask();
    if (added === null) return;
    if (added.status !== this.status()) return;
    this.taskList().nativeElement.scrollTo({ top: 0, left: 0 });
  });

  /** Measures the dragged card and passes its size to the container once dragging starts. */
  protected onDragStarted(event: CdkDragStart): void {
    const card = event.source.getPlaceholderElement();
    this.cardPressed.emit({ width: card.offsetWidth, height: card.offsetHeight });
    document.querySelector('.cdk-drag-preview')?.removeAttribute('popover');
  }
}
