import { Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { ResponsiveService } from '../../services/responsive.service';
import { Footer } from '../footer/footer';
import { UserService } from '../../services/user.service';

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
  responsiveService = inject(ResponsiveService);
  userService = inject(UserService);
  isShort = this.responsiveService.isMaxHeight(500);
  navList = [
    { section: 'summary', svgId: 'summary', label: 'Summary' },
    { section: 'add-task', svgId: 'task', label: 'Add Task' },
    { section: 'board', svgId: 'board', label: 'Board' },
    { section: 'contacts', svgId: 'contacts', label: 'Contacts' },
  ];
}
