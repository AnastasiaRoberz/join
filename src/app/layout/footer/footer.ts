import { Component, inject, input } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { ResponsiveService } from '../../services/responsive.service';

@Component({
  imports: [RouterLink, RouterLinkActive],
  selector: 'footer[app-footer]',
  styleUrl: './footer.scss',
  templateUrl: './footer.html',
  host: {
    '[class.is-widescreen]': 'responsiveService.isWidescreen()',
    '[class.auth-variant]': 'variant() === "auth"',
    '[class.sidebar-variant]': 'variant() === "sidebar"',
  },
})
export class Footer {
  responsiveService = inject(ResponsiveService);

  variant = input<'sidebar' | 'auth'>('sidebar');
}
