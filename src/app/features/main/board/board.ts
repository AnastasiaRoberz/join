import { Component } from '@angular/core';
import { BoardHeader } from './components/board-header/board-header';
import { BoardContainer } from './components/board-container/board-container';
import { CdkDropListGroup } from '@angular/cdk/drag-drop';

@Component({
  selector: 'app-board',
  imports: [BoardHeader, BoardContainer, CdkDropListGroup],
  templateUrl: './board.html',
  styleUrl: './board.scss',
})
export class Board {}
