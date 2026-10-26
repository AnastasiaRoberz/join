import { Component, inject, input, model } from '@angular/core';
import { ResponsiveService } from '../../services/responsive.service';
import { SubtaskInterface } from '../../interfaces/subtask.interface';
import { TaskService } from '../../services/task.service';

@Component({
  imports: [],
  selector: 'app-subtask-field',
  styleUrl: './subtask-field.component.scss',
  templateUrl: './subtask-field.component.html',
})
export class SubtaskFieldComponent {
  responsiveService = inject(ResponsiveService);
  taskService = inject(TaskService);

  subtasks = model<SubtaskInterface[]>([]);

  clearInput() {}

  saveSubtask() {}

  editSubtask() {}

  updateSubtask() {}
}
