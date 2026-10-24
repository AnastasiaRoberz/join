import { Component, effect, inject, input } from '@angular/core';
import { TextField } from '../../../../../shared/text-field/text-field';
import { DialogService } from '../../../../../services/dialog.service';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { TaskInterface } from '../../../../../interfaces/task.interface';
import { Buttons } from '../../../../../shared/button.component/button.component';
import { ContactService } from '../../../../../services/contact.service';
import { CalendarFieldComponent } from '../../../../../shared/calendar-field.component/calendar-field.component';

@Component({
  imports: [TextField, ReactiveFormsModule, Buttons, TextField, CalendarFieldComponent],
  selector: 'app-task-edit',
  styleUrl: './task-edit.scss',
  templateUrl: './task-edit.html',
})
export class TaskEdit {
  dialogService = inject(DialogService);
  contactService = inject(ContactService);
  fb = inject(FormBuilder);

  task = input<TaskInterface>();

  taskForm = this.fb.group({
    title: ['', { validators: [Validators.required] }],
    description: ['', { validators: [Validators.required] }],
    dueDate: ['', { validators: Validators.required }],
    priority: ['', { validators: Validators.required }],
    assignedTo: ['', { validators: Validators.required }],
    subtasks: ['', { validators: Validators.required }],
  });

  constructor() {
    effect(() => {
      const currentTask = this.task();
      if (currentTask) {
        this.taskForm.setValue({
          title: currentTask.title,
          description: currentTask.description,
          dueDate: null,
          priority: currentTask.priority,
          assignedTo: null,
          subtasks: null,
        });
      } else {
        this.taskForm.reset();
      }
    });
  }

  saveTask() {
    if (!this.taskForm.valid) return;
    const rawValue = this.taskForm.getRawValue();
  }
}
