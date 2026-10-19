import { Component } from '@angular/core';
import { Buttons } from '../../../shared/button.component/button.component';
import { PriorityBtn } from '../../../shared/priority-btn/priority-btn';

@Component({
  imports: [Buttons, PriorityBtn],
  selector: 'article[app-add-task]',
  styleUrl: './add-task.scss',
  templateUrl: './add-task.html',
})
export class AddTask {}
