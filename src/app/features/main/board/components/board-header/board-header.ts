import { Component, inject } from '@angular/core';
import { Buttons } from '../../../../../shared/button.component/button.component';
import { ResponsiveService } from '../../../../../services/responsive.service';

@Component({
  imports: [Buttons],
  selector: 'app-board-header',
  styleUrl: './board-header.scss',
  templateUrl: './board-header.html',
  host: {
    '[class.is-mobile]': 'responsiveService.isMobile()',
    '[class.is-tablet]': 'responsiveService.isTablet()',
    '[class.is-desktop]': 'responsiveService.isDesktop()',
  },
})
export class BoardHeader {
  responsiveService = inject(ResponsiveService);
}
