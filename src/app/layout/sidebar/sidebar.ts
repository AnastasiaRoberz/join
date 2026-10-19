import { Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { ResponsiveService } from '../../services/responsive.service';

@Component({
  imports: [RouterLink, RouterLinkActive],
  selector: 'app-sidebar',
  styleUrl: './sidebar.scss',
  templateUrl: './sidebar.html',
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
