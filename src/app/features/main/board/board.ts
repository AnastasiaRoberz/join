import { Component } from '@angular/core';
import { BoardHeader } from './components/board-header/board-header';
import { BoardContainer } from './components/board-container/board-container';
import { CdkDropListGroup } from '@angular/cdk/drag-drop';
import { CdkScrollable } from '@angular/cdk/scrolling';

@Component({
  selector: 'app-board',
  imports: [BoardHeader, BoardContainer, CdkDropListGroup],
  templateUrl: './board.html',
  styleUrl: './board.scss',
  hostDirectives: [CdkScrollable], // ensures page scrolls in mobile when card is draged to edge of screen.
})
export class Board {}
