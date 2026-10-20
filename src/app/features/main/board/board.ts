import { Component, inject } from '@angular/core';
import { Overlay } from './overlay/overlay';
import { TaskService } from '../../../services/task.service';

@Component({
  imports: [Overlay],
  selector: 'app-board',
  styleUrl: './board.scss',
  templateUrl: './board.html',
})
export class Board {
  taskService = inject(TaskService);
}
