import { Component, computed, effect, inject, input, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ScrollingModule } from '@angular/cdk/scrolling';
import { DialogService } from '../../../../../services/dialog.service';
import { TaskService } from '../../../../../services/task.service';
import { ContactService } from '../../../../../services/contact.service';
import { TaskInterface } from '../../../../../interfaces/task.interface';
import { TextField } from '../../../../../shared/text-field/text-field';
import { Buttons } from '../../../../../shared/button.component/button.component';
import { CalendarFieldComponent } from '../../../../../shared/calendar-field.component/calendar-field.component';
import { SelectFieldComponent } from '../../../../../shared/select-field.component/select-field.component';
import { UserAvatar } from '../../../../../shared/user-avatar/user-avatar';
import { CheckboxComponent } from '../../../../../shared/checkbox.component/checkbox.component';
import { SubtaskFieldComponent } from '../../../../../shared/subtask-field.component/subtask-field.component';
import { AvatarGroupComponent } from '../../../../../shared/avatar-group.component/avatar-group.component';
import { SubtaskInterface } from '../../../../../interfaces/subtask.interface';

/**
 * Dialog form component for editing an existing task's properties
 * (title, description, due date, priority, assigned contacts, and subtasks).
 *
 * Uses reactive forms (`taskForm`) synchronized with signals (`selectedContactIds`)
 * to provide immediate visual updates in the contact assignment dropdown and avatar footer.
 */
@Component({
  imports: [
    ReactiveFormsModule,
    ScrollingModule,
    TextField,
    Buttons,
    CalendarFieldComponent,
    SelectFieldComponent,
    UserAvatar,
    CheckboxComponent,
    SubtaskFieldComponent,
    AvatarGroupComponent,
  ],
  selector: 'app-task-edit',
  styleUrl: './task-edit.scss',
  templateUrl: './task-edit.html',
})
export class TaskEdit {
  /** Controls switching between the task detail view and the edit dialog. */
  dialogService = inject(DialogService);

  /** Handles persisting task and assignment updates to Supabase. */
  taskService = inject(TaskService);

  /** Provides the reactive list of sorted contacts for the assignment dropdown. */
  contactService = inject(ContactService);

  /** Angular FormBuilder instance used to construct `taskForm`. */
  private fb = inject(FormBuilder);

  // ---------------------------------------------------------------------------
  // Inputs, Signals & Computed State
  // ---------------------------------------------------------------------------

  /** The task currently being edited, passed in from the dialog container. */
  task = input.required<TaskInterface>();

  /** Reactive list of currently assigned contact IDs. */
  selectedContactIds = signal<number[]>([]);
  currentSubtasks = signal<SubtaskInterface[]>([]);

  /**
   * Full contact objects corresponding to `selectedContactIds()`,
   * used to render the assigned user avatars in the select-field footer.
   */
  selectedContacts = computed(() => {
    const ids = new Set(this.selectedContactIds());
    return this.contactService.sortedContacts().filter((contact) => ids.has(contact.id));
  });

  // ---------------------------------------------------------------------------
  // Reactive Form Definition
  // ---------------------------------------------------------------------------

  /** Reactive form group holding all editable task fields. */
  taskForm = this.fb.group({
    title: ['', { validators: [Validators.required] }],
    description: ['', { validators: [Validators.required] }],
    dueDate: ['', { validators: [Validators.required] }],
    priority: ['', { validators: [Validators.required] }],
  });

  /**
   * Populates `taskForm` and `selectedContactIds` whenever the `task()` input changes.
   */
  constructor() {
    effect(() => {
      const currentTask = this.task();
      if (currentTask) {
        this.selectedContactIds.set(currentTask.assigned_users?.map((u) => u.id) ?? []);
        this.currentSubtasks.set(currentTask.subtasks ?? []);

        this.taskForm.setValue({
          title: currentTask.title,
          description: currentTask.description,
          dueDate: currentTask.due_date,
          priority: currentTask.priority,
        });
      } else {
        this.selectedContactIds.set([]);
        this.currentSubtasks.set([]);
        this.taskForm.reset();
      }
    });
  }

  // ---------------------------------------------------------------------------
  // Assignment & Form Submission Methods
  // ---------------------------------------------------------------------------

  /**
   * Toggles a single contact's assignment state when clicking an option's checkbox
   * or the delete button on an avatar badge in the footer.
   *
   * @param contactId - The ID of the contact to assign or unassign.
   * @param isAssigned - `true` to assign the contact, `false` to remove the assignment.
   */
  toggleAssignment(contactId: number, isAssigned: boolean): void {
    const currentIds = this.selectedContactIds();
    const updatedIds = isAssigned
      ? currentIds.includes(contactId)
        ? currentIds
        : [...currentIds, contactId]
      : currentIds.filter((id) => id !== contactId);

    this.selectedContactIds.set(updatedIds);
  }

  /**
   * Persists the updated task details and contact assignments to the database,
   * then returns to the task detail dialog view.
   */
  async saveTask(): Promise<void> {
    // if (!this.taskForm.valid) return;
    const currentTaskId = this.task()?.id;
    const rawValue = this.taskForm.getRawValue();

    if (currentTaskId && rawValue) {
      await this.taskService.updateTask(currentTaskId, {
        title: rawValue.title!,
        description: rawValue.description!,
        due_date: rawValue.dueDate!,
      });

      await this.taskService.setTaskAssignments(currentTaskId, this.selectedContactIds());
      await this.taskService.setTaskSubtasks(currentTaskId, this.currentSubtasks());
    }

    this.dialogService.openDialog('task', this.task());
  }
}
