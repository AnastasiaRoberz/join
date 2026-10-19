import { Component } from '@angular/core';
import { Buttons } from '../../../../../shared/button.component/button.component';
import { UserAvatar } from '../../../../../shared/user-avatar/user-avatar';
import { CheckboxComponent } from '../../../../../shared/checkbox.component/checkbox.component';

@Component({
  imports: [Buttons, UserAvatar, CheckboxComponent],
  selector: 'app-task-details',
  styleUrl: './task-details.scss',
  templateUrl: './task-details.html',
})
export class TaskDetails {
  member = ['Emmanuel Mauer', 'Marcel Bauer', 'Anton Mayer'];

  tasks = ['Implement Recipe Recommendation', 'Start Page Layout'];
}
