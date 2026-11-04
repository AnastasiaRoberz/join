import { Component, inject } from '@angular/core';
import { Header } from '../../layout/header/header';
import { Sidebar } from '../../layout/sidebar/sidebar';
import { RouterOutlet } from '@angular/router';
import { ResponsiveService } from '../../services/responsive.service';
import { DialogComponent } from '../../shared/dialog.component/dialog.component';
import { DialogService } from '../../services/dialog.service';
import { ConfirmDialog } from '../../shared/confirm-dialog/confirm-dialog';

@Component({
  imports: [Header, Sidebar, RouterOutlet, DialogComponent, ConfirmDialog],
  selector: 'app-main',
  styleUrl: './main.scss',
  templateUrl: './main.html',
})
export class Main {
  responsiveService = inject(ResponsiveService);

  dialogService = inject(DialogService);
}
