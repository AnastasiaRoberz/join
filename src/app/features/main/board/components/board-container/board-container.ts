import { Component, computed, inject, signal } from '@angular/core';
import { TaskInterface } from '../../../../../interfaces/task.interface';
import { TaskService } from '../../../../../services/task.service';
import { BoardColumn } from '../board-column/board-column';
import {
  CdkDragDrop,
  CdkDropList,
  CdkDropListGroup,
  moveItemInArray,
  transferArrayItem,
} from '@angular/cdk/drag-drop';

/** Status of each board column, in the order the columns are shown. */
const COLUMN_STATUSES: TaskInterface['status'][] = [
  'To do',
  'In progress',
  'Await feedback',
  'Done',
];

@Component({
  selector: 'app-board-container',
  imports: [BoardColumn, CdkDropListGroup, CdkDropList],
  templateUrl: './board-container.html',
  styleUrl: './board-container.scss',
  // listens on mouse button being released, hides the placeholder
  host: { '(document:pointerup)': 'pressedColumnIndex.set(null)' },
})
export class BoardContainer {
  taskService = inject(TaskService);

  columns = computed(() => {
    const tasks = this.taskService.tasks();
    return COLUMN_STATUSES.map((status) => ({
      status,
      tasks: tasks.filter((task) => task.status === status).sort((a, b) => a.position - b.position),
      // sorting cards by position now, as its assigned automatically
    }));
  });

  /** Index of the column whose card is currently pressed, `null` if none. */
  pressedColumnIndex = signal<number | null>(null);

  /** Height (px) of the pressed card, used for the drop hints. */
  pressedCardHeight = signal(0);

  // drag and drop function assigning new status once dropped
  /**
   * Handles a dropped task. Reorders the task inside its column,
   * or moves it to another column, then saves the new order.
   *
   * @param event - Drop event from the CDK with the old and new column data
   * @param status - Status of the column the task was dropped into
   */
  dragDrop(event: CdkDragDrop<TaskInterface[]>, status: TaskInterface['status']) {
    // copy of the tasks in the column the card was dropped into (cdkDropListData)
    const newColumn = [...event.container.data];

    // Same status / column: task was only moved up or down (cdkDropListData)
    if (event.previousContainer === event.container) {
      // moves task from its old to its new index inside the same column (cdkDropListDropped)
      moveItemInArray(newColumn, event.previousIndex, event.currentIndex);
    } else {
      // change status: copy of the tasks in the column the card came from (cdkDropListData)
      const oldColumn = [...event.previousContainer.data];
      // removes task from old column and inserts it at the new index (where dropped) in the new one (cdkDropListDropped)
      transferArrayItem(oldColumn, newColumn, event.previousIndex, event.currentIndex);
    }

    // gives all tasks in the target column its column's status
    // and its new position based on its order in the array (using the index)
    const updatedColumns = newColumn.map((task, index) => ({ ...task, status, position: index }));
    // updates the board right away and saves status + position to Supabase
    this.taskService.saveColumn(updatedColumns);
  }

  /** True for the columns directly left and right of the pressed card's column. */
  isNeighbourColumn(index: number): boolean {
    // reads the signal and stores the index or null
    const pressed = this.pressedColumnIndex();
    // each column gets a hint, which is one away as well
    return pressed !== null && Math.abs(index - pressed) === 1;
  }
}
