import { Component, inject } from '@angular/core';
import { NavigationService } from '../../../../services/navigation.service';
import { ResponsiveService } from '../../../../services/responsive.service';
import { Buttons } from '../../../../shared/button.component/button.component';

/**
 * Information page explaining the features and workflow of the Join Kanban tool.
 */
@Component({
  imports: [Buttons],
  selector: 'article[app-help]',
  styleUrl: './help.scss',
  templateUrl: './help.html',
  host: {
    '[class.scroll-container]': 'isShortHeight()',
  },
})
export class Help {
  /** Navigation service used to navigate back to the previous view. */
  protected readonly navService = inject(NavigationService);

  /** Responsive service for viewport checks. */
  private readonly responsiveService = inject(ResponsiveService);

  /** Signal indicating viewports with height <= 500px requiring scroll-container styling. */
  protected readonly isShortHeight = this.responsiveService.isMaxHeight(500);
}
