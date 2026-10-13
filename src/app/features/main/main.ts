import { Component, inject } from '@angular/core';
import { Header } from '../../layout/header/header';
import { Sidebar } from '../../layout/sidebar/sidebar';
import { RouterOutlet } from '@angular/router';
import { Footer } from '../../layout/footer/footer';

@Component({
  imports: [Header, Sidebar, RouterOutlet, Footer],
  selector: 'app-main',
  styleUrl: './main.scss',
  templateUrl: './main.html',
})
export class Main {}
