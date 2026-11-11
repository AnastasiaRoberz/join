import { Component, inject, input } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { ResponsiveService } from '../../services/responsive.service';

/**
 * Global footer hosting links to Privacy Policy and Legal Notice.
 * Adapts to sidebar layout or authentication page layout.
 */
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
  /** Responsive service for widescreen layout detection. */
  protected readonly responsiveService = inject(ResponsiveService);

  /** Presentation variant: `'sidebar'` (default) or `'auth'`. */
  public readonly variant = input<'sidebar' | 'auth'>('sidebar');
}
