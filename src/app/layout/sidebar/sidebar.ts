import { Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { ResponsiveService } from '../../services/responsive.service';
import { Footer } from '../footer/footer';

@Component({
  imports: [RouterLink, RouterLinkActive, Footer],
  selector: 'app-sidebar',
  styleUrl: './sidebar.scss',
  templateUrl: './sidebar.html',
  host: {
    '[class.is-mobile]': 'responsiveService.isMobile()',
  },
})
export class Sidebar {
  responsiveService = inject(ResponsiveService);
  navList = [
    { section: 'summary', svgId: 'summary', label: 'Summary' },
    { section: 'add-task', svgId: 'task', label: 'Add Task' },
    { section: 'board', svgId: 'board', label: 'Board' },
    { section: 'contacts', svgId: 'contacts', label: 'Contacts' },
  ];
}
