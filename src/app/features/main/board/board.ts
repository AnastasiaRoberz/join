import { Component, inject } from '@angular/core';
import { BoardHeader } from './components/board-header/board-header';
import { BoardContainer } from './components/board-container/board-container';
import { CdkDropListGroup } from '@angular/cdk/drag-drop';
import { CdkScrollable } from '@angular/cdk/scrolling';
import { ResponsiveService } from '../../../services/responsive.service';

@Component({
  selector: 'app-board',
  imports: [BoardHeader, BoardContainer, CdkDropListGroup],
  templateUrl: './board.html',
  styleUrl: './board.scss',
  hostDirectives: [CdkScrollable], // ensures page scrolls in mobile when card is draged to edge of screen.
  host: {
    '[class.scroll-container]': 'isShortHeight() || responsiveService.isMobile()',
  },
})
export class Board {
  responsiveService = inject(ResponsiveService);

  isShortHeight = this.responsiveService.isMaxHeight(500);
  boardBreakpoint = this.responsiveService.isMaxWidth(1280);
}
