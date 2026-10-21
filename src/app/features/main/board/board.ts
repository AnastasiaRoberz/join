import { Component, inject, signal } from '@angular/core';
import { TaskService } from '../../../services/task.service';
import { DialogService } from '../../../services/dialog.service';
import { TaskInterface } from '../../../interfaces/task.interface';

@Component({
  imports: [],
  selector: 'app-board',
  styleUrl: './board.scss',
  templateUrl: './board.html',
})
export class Board {
  taskService = inject(TaskService);
  dialogService = inject(DialogService);
  exTask = signal<TaskInterface | null>(null);

  constructor() {
    this.getTask();
  }

  async getTask() {
    const task = await this.taskService.getOneTask(7);
    this.exTask.set(task);
  }
}
