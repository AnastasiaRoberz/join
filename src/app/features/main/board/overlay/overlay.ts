import { Component } from '@angular/core';
import { TaskDetails } from './task-details/task-details';

@Component({
  imports: [TaskDetails],
  selector: 'app-overlay',
  styleUrl: './overlay.scss',
  templateUrl: './overlay.html',
})
export class Overlay {}
