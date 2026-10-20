import { Component, computed, inject, input } from '@angular/core';
import { Buttons } from '../../../../../shared/button.component/button.component';
import { UserAvatar } from '../../../../../shared/user-avatar/user-avatar';
import { CheckboxComponent } from '../../../../../shared/checkbox.component/checkbox.component';
import { TaskService } from '../../../../../services/task.service';

@Component({
  imports: [Buttons, UserAvatar, CheckboxComponent],
  selector: 'app-task-details',
  styleUrl: './task-details.scss',
  templateUrl: './task-details.html',
})
export class TaskDetails {
  taskService = inject(TaskService);

  selectedId = input<number>(6);

  selectedTask = computed(() => {
    console.log(this.taskService.tasks());

    return this.taskService.tasks().find((task) => task.id === this.selectedId());
  });
}
