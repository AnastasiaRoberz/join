import { Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { ResponsiveService } from '../../services/responsive.service';

@Component({
  imports: [RouterLink, RouterLinkActive],
  selector: 'footer[app-footer]',
  styleUrl: './footer.scss',
  templateUrl: './footer.html',
})
export class Footer {
  responsiveService = inject(ResponsiveService);
}
