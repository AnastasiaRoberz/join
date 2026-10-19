import { Component } from '@angular/core';
import { Overlay } from './overlay/overlay';

@Component({
  imports: [Overlay],
  selector: 'app-board',
  styleUrl: './board.scss',
  templateUrl: './board.html',
})
export class Board {}
