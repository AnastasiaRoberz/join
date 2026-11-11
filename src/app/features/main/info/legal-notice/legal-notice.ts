import { Component, inject } from '@angular/core';
import { NavigationService } from '../../../../services/navigation.service';
import { ResponsiveService } from '../../../../services/responsive.service';
import { Buttons } from '../../../../shared/button.component/button.component';

/**
 * Legal notice (Impressum) page.
 */
@Component({
  imports: [Buttons],
  selector: 'article[app-legal-notice]',
  styleUrl: './legal-notice.scss',
  templateUrl: './legal-notice.html',
  host: {
    '[class.scroll-container]': 'isShortHeight()',
  },
})
export class LegalNotice {
  /** Navigation service used to navigate back to the previous view. */
  protected readonly navService = inject(NavigationService);

  /** Responsive service for viewport checks. */
  private readonly responsiveService = inject(ResponsiveService);

  /** Signal indicating viewports with height <= 500px requiring scroll-container styling. */
  protected readonly isShortHeight = this.responsiveService.isMaxHeight(500);
}
