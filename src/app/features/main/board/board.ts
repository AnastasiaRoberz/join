import { Component } from '@angular/core';
import { BoardHeader } from './components/board-header/board-header';
import { BoardContainer } from './components/board-container/board-container';

@Component({
  selector: 'app-board',
  imports: [BoardHeader, BoardContainer],
  templateUrl: './board.html',
  styleUrl: './board.scss',
})
export class Board {}