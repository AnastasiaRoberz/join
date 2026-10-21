import { Component, inject } from '@angular/core';
import { Header } from '../../layout/header/header';
import { Sidebar } from '../../layout/sidebar/sidebar';
import { RouterOutlet } from '@angular/router';
import { ResponsiveService } from '../../services/responsive.service';
import { DialogComponent } from '../../shared/dialog.component/dialog.component';
import { DialogService } from '../../services/dialog.service';

@Component({
  imports: [Header, Sidebar, RouterOutlet, DialogComponent],
  selector: 'app-main',
  styleUrl: './main.scss',
  templateUrl: './main.html',
  host: {
    '[class.is-tablet]': 'responsiveService.isTablet()',
  },
})
export class Main {
  responsiveService = inject(ResponsiveService);

  dialogService = inject(DialogService);
}
