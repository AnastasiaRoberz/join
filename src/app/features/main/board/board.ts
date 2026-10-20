import { Component, inject } from '@angular/core';
import { TaskDetails } from './overlay/task-details/task-details';
import { TaskService } from '../../../services/task.service';

@Component({
  imports: [TaskDetails],
  selector: 'app-board',
  styleUrl: './board.scss',
  templateUrl: './board.html',
})
export class Board {
  taskService = inject(TaskService);
}
