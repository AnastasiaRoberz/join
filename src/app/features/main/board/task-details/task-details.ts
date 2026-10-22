import { Component, computed, inject, input } from '@angular/core';
import { Buttons } from '../../../../shared/button.component/button.component';
import { UserAvatar } from '../../../../shared/user-avatar/user-avatar';
import { CheckboxComponent } from '../../../../shared/checkbox.component/checkbox.component';
import { TaskService } from '../../../../services/task.service';
import { capitalizeFirstLetter } from '../../../../utils/utils';
import { DialogService } from '../../../../services/dialog.service';

@Component({
  imports: [Buttons, UserAvatar, CheckboxComponent],
  selector: 'app-task-details',
  styleUrl: './task-details.scss',
  templateUrl: './task-details.html',
})
export class TaskDetails {
  taskService = inject(TaskService);
  dialogService = inject(DialogService);
  capitalizeFirstLetter = capitalizeFirstLetter;

  selectedId = input<number>(1);
  selectedTask = computed(() => {
    return this.taskService.tasks().find((task) => task.id === this.selectedId());
  });

  async toggleSubtaskStatus(subtaskId: number, taskId: number, isDone: boolean): Promise<void> {
    const success = await this.taskService.updateSubtask(subtaskId, taskId, { is_done: isDone });
  }
}
