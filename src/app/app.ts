import { Component, inject, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Main } from './features/main/main';

@Component({
  imports: [RouterOutlet, Main],
  selector: 'app-root',
  styleUrl: './app.scss',
  templateUrl: './app.html',
})
export class App {
  protected readonly title = signal('join');
}
