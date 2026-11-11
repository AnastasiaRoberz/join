import { Component, inject, OnInit } from '@angular/core';
import { Header } from '../../layout/header/header';
import { Sidebar } from '../../layout/sidebar/sidebar';
import { RouterOutlet } from '@angular/router';
import { ResponsiveService } from '../../services/responsive.service';
import { DialogComponent } from '../../shared/dialog.component/dialog.component';
import { DialogService } from '../../services/dialog.service';
import { ConfirmDialog } from '../../shared/confirm-dialog/confirm-dialog';
import { UserService } from '../../services/user.service';

/**
 * Main application shell wrapping header, sidebar, router outlet, and global dialog overlays.
 */
@Component({
  imports: [Header, Sidebar, RouterOutlet, DialogComponent, ConfirmDialog],
  selector: 'app-main',
  styleUrl: './main.scss',
  templateUrl: './main.html',
})
export class Main implements OnInit {
  /** Responsive service for shell-level layout awareness. */
  protected readonly responsiveService = inject(ResponsiveService);

  /** Dialog service managing global modal visibility. */
  protected readonly dialogService = inject(DialogService);

  /** User service managing authentication session state. */
  private readonly userService = inject(UserService);

  /** Restores user session on initial application shell mount. */
  public ngOnInit(): void {
    this.userService.restoreSession();
  }
}
