import { Component } from '@angular/core';
import { Header } from '../../layout/header/header';
import { Sidebar } from '../../layout/sidebar/sidebar';
import { Contacts } from './contacts/contacts';

@Component({
  imports: [Header, Sidebar, Contacts],
  selector: 'app-main',
  styleUrl: './main.scss',
  templateUrl: './main.html',
})
export class Main {}
