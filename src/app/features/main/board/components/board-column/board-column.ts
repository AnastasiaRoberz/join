import { Component, inject, input } from '@angular/core';
import { TaskInterface } from '../../../../../interfaces/task.interface';
import { TaskCard } from '../../../../../shared/task-card/task-card';
import { Buttons } from '../../../../../shared/button.component/button.component';
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
  imports: [Buttons, TaskCard], // RouterLink entfernt, da er hier nicht mehr benötigt wird
  selector: 'app-board-column',
  styleUrl: './board-column.scss',
  templateUrl: './board-column.html',
})
export class BoardColumn {
  /** Status of the column, also used as its title (e.g. "To do"). */
  status = input.required<TaskInterface['status']>();

  /** Tasks that are shown in this column. */
  tasks = input.required<TaskInterface[]>();

  // Services injizieren (analog zum BoardHeader)
  dialogService = inject(DialogService);
  taskService = inject(TaskService);

  /**
   * Öffnet den Add-Task-Dialog als Overlay.
   * Falls nötig, kann hier auch der Status der aktuellen Spalte an den Service übergeben werden.
   */
  openAddTask(): void {
    // Falls du den Status im TaskService zwischenspeichern musst, damit das Formular weiß,
    // in welche Spalte der Task soll (z. B. this.taskService.setNewTaskStatus(this.status())), 
    // kannst du das hier machen.
    
    this.dialogService.openDialog('add-task');
  }
}