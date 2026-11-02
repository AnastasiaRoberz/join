import { Component, inject } from '@angular/core';
import { NavigationService } from '../../../../services/navigation.service';
import { ResponsiveService } from '../../../../services/responsive.service';
import { Buttons } from '../../../../shared/button.component/button.component';

@Component({
  imports: [Buttons],
  selector: 'app-privacy-policy',
  styleUrl: './privacy-policy.scss',
  templateUrl: './privacy-policy.html',
})
export class PrivacyPolicy {
  navService = inject(NavigationService);
  responsiveService = inject(ResponsiveService);

  isWidescreen = this.responsiveService.observeQuery('(min-width: 1441px)');
}
