import { Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { ResponsiveService } from '../../services/responsive.service';
import { Footer } from '../footer/footer';
import { UserService } from '../../services/user.service';
import { TaskService } from '../../services/task.service';

/** Navigation link item structure. */
export interface NavItem {
  section: string;
  svgId: string;
  label: string;
}

/**
 * Main application sidebar / navigation bar for tablet and desktop views.
 */
@Component({
  imports: [RouterLink, RouterLinkActive, Footer],
  selector: 'app-sidebar',
  styleUrl: './sidebar.scss',
  templateUrl: './sidebar.html',
  host: {
    '[class.is-tablet]': 'responsiveService.isTablet()',
  },
})
export class Sidebar {
  /** Responsive service for layout adjustments on tablet and short viewports. */
  protected readonly responsiveService = inject(ResponsiveService);

  /** User service providing auth session state for navigation links. */
  protected readonly userService = inject(UserService);

  /** Task service used to clear board filter when navigating to board. */
  private readonly taskService = inject(TaskService);

  /** Signal indicating viewports with height <= 500px to hide logo. */
  protected readonly isShort = this.responsiveService.isMaxHeight(500);

  /** List of primary application navigation items. */
  protected readonly navList: readonly NavItem[] = [
    { section: 'summary', svgId: 'summary', label: 'Summary' },
    { section: 'add-task', svgId: 'task', label: 'Add Task' },
    { section: 'board', svgId: 'board', label: 'Board' },
    { section: 'contacts', svgId: 'contacts', label: 'Contacts' },
  ];

  /** Handles navigation item click, clearing board filter when board is selected. */
  protected onNavClick(section: string): void {
    if (section === 'board') {
      this.taskService.clearBoardFilter();
    }
  }
}
