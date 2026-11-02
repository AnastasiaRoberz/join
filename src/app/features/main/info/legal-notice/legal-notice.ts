import { Component, inject } from '@angular/core';
import { NavigationService } from '../../../../services/navigation.service';
import { ResponsiveService } from '../../../../services/responsive.service';
import { Buttons } from '../../../../shared/button.component/button.component';

@Component({
  imports: [Buttons],
  selector: 'app-legal-notice',
  styleUrl: './legal-notice.scss',
  templateUrl: './legal-notice.html',
})
export class LegalNotice {
  navService = inject(NavigationService);
  responsiveService = inject(ResponsiveService);

  isWidescreen = this.responsiveService.observeQuery('(min-width: 1441px)');
}
