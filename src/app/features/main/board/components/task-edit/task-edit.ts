import { Component, effect, inject, input } from '@angular/core';
import { TextField } from '../../../../../shared/text-field/text-field';
import { DialogService } from '../../../../../services/dialog.service';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { TaskInterface } from '../../../../../interfaces/task.interface';
import { Buttons } from '../../../../../shared/button.component/button.component';
import { CalendarFieldComponent } from '../../../../../shared/calendar-field.component/calendar-field.component';
import { SelectFieldComponent } from '../../../../../shared/select-field.component/select-field.component';
import { ScrollingModule } from '@angular/cdk/scrolling';
import { TaskService } from '../../../../../services/task.service';
import { ContactService } from '../../../../../services/contact.service';

@Component({
  imports: [
    TextField,
    ReactiveFormsModule,
    Buttons,
    TextField,
    CalendarFieldComponent,
    SelectFieldComponent,
    ScrollingModule,
  ],
  selector: 'app-task-edit',
  styleUrl: './task-edit.scss',
  templateUrl: './task-edit.html',
})
export class TaskEdit {
  dialogService = inject(DialogService);
  taskService = inject(TaskService);
  contactService = inject(ContactService);
  fb = inject(FormBuilder);

  task = input<TaskInterface>();

  taskForm = this.fb.group({
    title: ['', { validators: [Validators.required] }],
    description: ['', { validators: [Validators.required] }],
    dueDate: ['', { validators: Validators.required }],
    priority: ['', { validators: Validators.required }],
    assignedTo: this.fb.control<number[]>([]),
    subtasks: ['', { validators: Validators.required }],
  });

  constructor() {
    effect(() => {
      const currentTask = this.task();
      if (currentTask) {
        this.taskForm.setValue({
          title: currentTask.title,
          description: currentTask.description,
          dueDate: currentTask.due_date,
          priority: currentTask.priority,
          assignedTo: currentTask.assigned_users?.map((user) => user.id) ?? [],
          subtasks: null,
        });
      } else {
        this.taskForm.reset();
      }
    });
  }

  onAssignedChange(ids: number[]): void {
    this.taskForm.controls.assignedTo.setValue(ids);
    this.taskForm.controls.assignedTo.markAsDirty();
  }

  async saveTask() {
    // if (!this.taskForm.valid) return;
    const currentTaskId = this.task()?.id;
    const rawValue = this.taskForm.getRawValue();

    if (currentTaskId) {
      await this.taskService.updateTask(currentTaskId, {
        title: rawValue.title!,
        description: rawValue.description!,
        due_date: rawValue.dueDate!,
      });

      const newContactIds = rawValue.assignedTo ?? [];
      await this.taskService.setTaskAssignment(currentTaskId, newContactIds);
    }

    this.dialogService.openDialog('task', this.task());
  }
}
