import { Component, inject, signal } from '@angular/core';
import { TaskService } from '../../../services/task.service';
import { DialogService } from '../../../services/dialog.service';
import { TaskInterface } from '../../../interfaces/task.interface';
import { BoardHeader } from './components/board-header/board-header';

@Component({
  imports: [BoardHeader],
  selector: 'app-board',
  styleUrl: './board.scss',
  templateUrl: './board.html',
})
export class Board {}
