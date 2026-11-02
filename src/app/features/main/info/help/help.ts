import { Component, inject } from '@angular/core';
import { NavigationService } from '../../../../services/navigation.service';
import { ResponsiveService } from '../../../../services/responsive.service';

@Component({
  imports: [],
  selector: 'app-help',
  styleUrl: './help.scss',
  templateUrl: './help.html',
})
export class Help {
  navService = inject(NavigationService);
  responsiveService = inject(ResponsiveService);

  isWidescreen = this.responsiveService.observeQuery('(min-width: 1441px)');
}
