import { Component, inject } from '@angular/core';
import { Header } from '../../layout/header/header';
import { Sidebar } from '../../layout/sidebar/sidebar';
import { RouterOutlet } from '@angular/router';
import { ResponsiveService } from '../../services/responsive.service';
import { ConfirmDialog } from '../../shared/confirm-dialog/confirm-dialog';

@Component({
  imports: [Header, Sidebar, RouterOutlet, ConfirmDialog],
  selector: 'app-main',
  styleUrl: './main.scss',
  templateUrl: './main.html',
  host: {
    '[class.is-tablet]': 'responsiveService.isTablet()',
  },
})
export class Main {
  responsiveService = inject(ResponsiveService);
}
