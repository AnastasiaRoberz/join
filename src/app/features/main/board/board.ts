import { Component } from '@angular/core';
import { BoardHeader } from './components/board-header/board-header';

@Component({
  imports: [BoardHeader],
  selector: 'app-board',
  styleUrl: './board.scss',
  templateUrl: './board.html',
})
export class Board {}
