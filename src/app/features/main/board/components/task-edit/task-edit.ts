import { Component, computed, effect, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { CdkScrollable } from '@angular/cdk/scrolling';
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
import { Priority, PriorityBtn } from '../../../../../shared/priority-btn/priority-btn';
import { generalCustomValidators } from '../../../../../utils/custom-validators';
import { UserService } from '../../../../../services/user.service';
import { ResponsiveService } from '../../../../../services/responsive.service';

/**
 * Dialog form component for editing an existing task's properties
 * (title, description, due date, priority, assigned contacts, and subtasks).
 *
 * State model:
 * - Title, description, due date, and priority live in the reactive form `taskForm`.
 * - Assigned contacts (`selectedContactIds`) and subtasks (`currentSubtasks`) live in
 *   local signals bound to child components.
 *
 * @example
 * ```ts
 * dialogService.openDialog('task-edit', task);
 * ```
 */
@Component({
  imports: [
    ReactiveFormsModule,
    TextField,
    Buttons,
    CalendarFieldComponent,
    SelectFieldComponent,
    UserAvatar,
    CheckboxComponent,
    SubtaskFieldComponent,
    AvatarGroupComponent,
    PriorityBtn,
    CdkScrollable,
  ],
  selector: 'app-task-edit',
  styleUrl: './task-edit.scss',
  templateUrl: './task-edit.html',
  host: {
    '[class.scroll-container]': 'isShortHeight()',
  },
})
export class TaskEdit {
  /** Controls switching between task detail view and edit dialog. */
  private readonly dialogService = inject(DialogService);

  /** Responsive service for viewport checks. */
  protected readonly responsiveService = inject(ResponsiveService);

  /** Task service for persisting task, assignment, and subtask updates. */
  private readonly taskService = inject(TaskService);

  /** Contact service providing contact search strings for the assignment dropdown. */
  protected readonly contactService = inject(ContactService);

  /** User service providing assignable contacts for the assignment dropdown. */
  protected readonly userService = inject(UserService);

  /** Signal indicating viewports with height <= 600px. */
  protected readonly isShortHeight = this.responsiveService.isMaxHeight(600);

  /** Angular FormBuilder instance used to construct `taskForm`. */
  private readonly fb = inject(FormBuilder);

  /** The task currently being edited, resolved from `DialogService`. */
  public readonly currentTask = computed<TaskInterface | null>(
    () => this.dialogService.selectedItem() as TaskInterface | null,
  );

  /** Local unsaved list of assigned contact IDs. */
  public readonly selectedContactIds = signal<number[]>([]);

  /** Local unsaved working copy of task subtasks. */
  public readonly currentSubtasks = signal<SubtaskInterface[]>([]);

  /** Full contact objects matching `selectedContactIds()`. */
  protected readonly selectedContacts = computed(() => {
    const ids = new Set(this.selectedContactIds());
    return this.contactService.sortedContacts().filter((contact) => ids.has(contact.id));
  });

  /** Reactive form group holding editable task fields. */
  protected readonly taskForm = this.fb.group({
    title: ['', [Validators.required, Validators.maxLength(200), generalCustomValidators()]],
    description: [''],
    dueDate: ['', [Validators.required]],
    priority: this.fb.control<Priority>('medium', { nonNullable: true }),
  });

  constructor() {
    effect(() => this.syncFormWithTask(this.currentTask()));
  }

  /**
   * Toggles assignment for a single contact in the local edit state.
   *
   * @param contactId - ID of the contact to toggle.
   * @param isAssigned - Whether the contact should be assigned.
   */
  protected toggleAssignment(contactId: number, isAssigned: boolean): void {
    const currentIds = this.selectedContactIds();
    const updatedIds = isAssigned
      ? currentIds.includes(contactId)
        ? currentIds
        : [...currentIds, contactId]
      : currentIds.filter((id) => id !== contactId);

    this.selectedContactIds.set(updatedIds);
  }

  /**
   * Persists all task edits to the database and returns to task detail view.
   */
  protected async saveTask(): Promise<void> {
    if (this.taskForm.invalid) {
      this.taskForm.markAllAsTouched();
      return;
    }
    const currentTaskId = this.currentTask()?.id;
    if (currentTaskId) {
      await this.persistTaskUpdates(currentTaskId);
    }

    const updatedTask = this.taskService.tasks().find((t) => t.id === currentTaskId);
    this.dialogService.openDialog('task', updatedTask);
  }

  /** Synchronizes form controls and signals with incoming task data. */
  private syncFormWithTask(task: TaskInterface | null): void {
    if (task) {
      this.selectedContactIds.set(task.assigned_users?.map((u) => u.id) ?? []);
      this.currentSubtasks.set(task.subtasks ?? []);
      this.taskForm.setValue({
        title: task.title,
        description: task.description,
        dueDate: task.due_date,
        priority: task.priority,
      });
    } else {
      this.resetTaskEditState();
    }
  }

  /** Clears form controls and local signals when no task is active. */
  private resetTaskEditState(): void {
    this.selectedContactIds.set([]);
    this.currentSubtasks.set([]);
    this.taskForm.reset();
  }

  /** Writes task field updates, assignments, and subtasks to Supabase. */
  private async persistTaskUpdates(taskId: number): Promise<void> {
    const rawValue = this.taskForm.getRawValue();
    await this.taskService.updateTask(taskId, {
      title: rawValue.title!,
      description: rawValue.description!,
      due_date: rawValue.dueDate!,
      priority: rawValue.priority,
    });
    await this.taskService.setTaskAssignments(taskId, this.selectedContactIds());
    await this.taskService.setTaskSubtasks(taskId, this.currentSubtasks());
  }
}
