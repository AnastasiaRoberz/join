import { Component, inject } from '@angular/core';
import { Header } from '../../layout/header/header';
import { Sidebar } from '../../layout/sidebar/sidebar';
import { RouterOutlet } from '@angular/router';
import { Footer } from '../../layout/footer/footer';
import { ConfirmDialog } from '../../shared/confirm-dialog/confirm-dialog';

@Component({
  imports: [Header, Sidebar, RouterOutlet, Footer, ConfirmDialog],
  selector: 'app-main',
  styleUrl: './main.scss',
  templateUrl: './main.html',
})
export class Main {}