import { Component, inject } from '@angular/core';
import { BoardHeader } from './components/board-header/board-header';
import { BoardContainer } from './components/board-container/board-container';
import { CdkDropListGroup } from '@angular/cdk/drag-drop';
import { CdkScrollable } from '@angular/cdk/scrolling';
import { ResponsiveService } from '../../../services/responsive.service';

/**
 * Main Kanban board page shell containing board header and four drag-and-drop columns.
 */
@Component({
  selector: 'app-board',
  imports: [BoardHeader, BoardContainer, CdkDropListGroup],
  templateUrl: './board.html',
  styleUrl: './board.scss',
  hostDirectives: [CdkScrollable],
  host: {
    '[class.scroll-container]': 'isShortHeight() || responsiveService.isMobile()',
  },
})
export class Board {
  /** Responsive layout service for breakpoint queries. */
  protected readonly responsiveService = inject(ResponsiveService);

  /** Signal indicating viewports with height <= 500px. */
  protected readonly isShortHeight = this.responsiveService.isMaxHeight(500);

  /** Signal indicating viewports narrower than 1140px where columns scroll horizontally. */
  protected readonly boardBreakpoint = this.responsiveService.horizontalDrag;
}
