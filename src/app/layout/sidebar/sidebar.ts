import { Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { ResponsiveService } from '../../services/responsive.service';
import { Footer } from '../footer/footer';
import { Buttons } from '../../shared/button.component/button.component';

@Component({
  imports: [RouterLink, RouterLinkActive, Footer, Buttons],
  selector: 'app-sidebar',
  styleUrl: './sidebar.scss',
  templateUrl: './sidebar.html',
  host: {
    '[class.is-tablet]': 'responsiveService.isTablet()',
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
