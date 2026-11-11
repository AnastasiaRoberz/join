import { Component, computed, inject, signal } from '@angular/core';
import { TaskInterface } from '../../../../../interfaces/task.interface';
import { TaskService } from '../../../../../services/task.service';
import { BoardColumn } from '../board-column/board-column';
import {
  CdkDragDrop,
  CdkDropList,
  moveItemInArray,
  transferArrayItem,
} from '@angular/cdk/drag-drop';
import { ResponsiveService } from '../../../../../services/responsive.service';
import { CdkScrollable } from '@angular/cdk/scrolling';

/** Status of each board column, in the order the columns are shown. */
const COLUMN_STATUSES: TaskInterface['status'][] = [
  'To do',
  'In progress',
  'Await feedback',
  'Done',
];

/** Column data structure holding tasks for a status. */
export interface BoardColumnData {
  status: TaskInterface['status'];
  tasks: TaskInterface[];
}

/**
 * Container component arranging the four Kanban board columns with drag-and-drop support.
 */
@Component({
  selector: 'app-board-container',
  imports: [BoardColumn, CdkDropList],
  templateUrl: './board-container.html',
  styleUrl: './board-container.scss',
  hostDirectives: [CdkScrollable],
  host: { '(document:pointerup)': 'pressedColumnIndex.set(null)' },
})
export class BoardContainer {
  /** Task service providing filtered tasks and column reorder persistence. */
  private readonly taskService = inject(TaskService);

  /** Responsive service for horizontal vs. vertical drag orientation. */
  protected readonly responsiveService = inject(ResponsiveService);

  /** Grouped tasks by column status, sorted by their position. */
  protected readonly columns = computed<BoardColumnData[]>(() => {
    const tasks = this.taskService.filteredTasks();
    return COLUMN_STATUSES.map((status) => ({
      status,
      tasks: tasks.filter((task) => task.status === status).sort((a, b) => a.position - b.position),
    }));
  });

  /** Index of the column whose card is currently pressed, `null` if none. */
  protected readonly pressedColumnIndex = signal<number | null>(null);

  /** Size (px) of the pressed card, used for the drop hints. */
  protected readonly pressedCardSize = signal<{ width: number; height: number }>({
    width: 0,
    height: 0,
  });

  /**
   * Handles a dropped task. Reorders the task inside its column,
   * or moves it to another column, then saves the new order.
   *
   * @param event - Drop event from the CDK with the old and new column data.
   * @param status - Status of the column the task was dropped into.
   */
  protected dragDrop(event: CdkDragDrop<TaskInterface[]>, status: TaskInterface['status']): void {
    const sameColumn = event.previousContainer === event.container;
    if (sameColumn && event.previousIndex === event.currentIndex) return;

    const newColumn = this.getReorderedColumnTasks(event, sameColumn);
    const updatedColumns = newColumn.map((task, index) => ({ ...task, status, position: index }));
    const movedTaskId = sameColumn ? null : updatedColumns[event.currentIndex].id;
    this.taskService.saveColumn(updatedColumns, movedTaskId);
  }

  /**
   * Reorders items within the same column or transfers an item between columns.
   */
  private getReorderedColumnTasks(
    event: CdkDragDrop<TaskInterface[]>,
    sameColumn: boolean,
  ): TaskInterface[] {
    const newColumn = [...event.container.data];
    if (sameColumn) {
      moveItemInArray(newColumn, event.previousIndex, event.currentIndex);
    } else {
      const oldColumn = [...event.previousContainer.data];
      transferArrayItem(oldColumn, newColumn, event.previousIndex, event.currentIndex);
    }
    return newColumn;
  }

  /** True for the columns directly left and right of the pressed card's column. */
  protected isNeighbourColumn(index: number): boolean {
    const pressed = this.pressedColumnIndex();
    return pressed !== null && Math.abs(index - pressed) === 1;
  }
}
