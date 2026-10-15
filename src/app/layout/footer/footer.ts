import { Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { ResponsiveService } from '../../services/responsive.service';

@Component({
  imports: [RouterLink, RouterLinkActive],
  selector: 'app-footer',
  styleUrl: './footer.scss',
  templateUrl: './footer.html',
  host: {
    '[class.is-widescreen]': 'responsiveService.isWidescreen()',
    '[class.is-mobile]': 'responsiveService.isMobile()',
  },
})
export class Footer {
  responsiveService = inject(ResponsiveService);
}
