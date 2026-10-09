import { Component, inject } from '@angular/core';
import { Header } from '../../layout/header/header';
import { Sidebar } from '../../layout/sidebar/sidebar';
import { RouterOutlet } from '@angular/router';
import { ContactDialog } from './contacts/components/contact-dialog/contact-dialog';
import { DialogService } from '../../services/dialog';
@Component({
  imports: [Header, Sidebar, RouterOutlet, ContactDialog],
  selector: 'app-main',
  styleUrl: './main.scss',
  templateUrl: './main.html',
})
export class Main {
  dialogService = inject(DialogService);
}
