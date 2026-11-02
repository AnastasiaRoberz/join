import { Component, computed, effect, inject, signal } from '@angular/core';
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
import { Priority, PriorityBtn } from '../../../../../shared/priority-btn/priority-btn';

/**
 * Dialog form component for editing an existing task's properties
 * (title, description, due date, priority, assigned contacts, and subtasks).
 *
 * ### State model
 * - Title, description, due date and priority live in the reactive form `taskForm`.
 * - Assigned contacts (`selectedContactIds`) and subtasks (`currentSubtasks`) live in
 *   local signals, because they are not simple form controls. They are bound to the child
 *imports: [
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
    PriorityBtn
]@example
 * ```ts
 * // e.g. from TaskDetails: switch from the detail view to the edit view
 * dialogService.openDialog('task-edit', task);
 * ```
 * ```html
 * <app-task-edit [task]="dialogService.selectedItem()" />
 * ```
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
    PriorityBtn,
  ],
  selector: 'app-task-edit',
  styleUrl: './task-edit.scss',
  templateUrl: './task-edit.html',
})
export class TaskEdit {
  /**
   * Controls switching between the task detail view and the edit dialog
   * (used by the close button and after saving to return to the detail view).
   */
  dialogService = inject(DialogService);

  /** Handles persisting task, assignment and subtask updates to Supabase (only called from `saveTask()`). */
  taskService = inject(TaskService);

  /** Provides the reactive list of sorted contacts and their search strings for the assignment dropdown. */
  contactService = inject(ContactService);

  /** Angular FormBuilder instance used to construct `taskForm`. */
  private fb = inject(FormBuilder);

  // ---------------------------------------------------------------------------
  // Inputs, Signals & Computed State
  // ---------------------------------------------------------------------------

  /**
   * The task currently being edited, passed in from the dialog container.
   * Whenever it changes, the local edit state is re-initialized from it (see constructor).
   */
  currentTask = computed(() => this.dialogService.selectedItem() as TaskInterface);

  /**
   * Local, unsaved list of currently assigned contact IDs.
   * Two-way bound to the `value` of the multi-select (`[(value)]="selectedContactIds"`) and
   * additionally updated by `toggleAssignment()`. Only persisted in `saveTask()`.
   */
  selectedContactIds = signal<number[]>([]);

  /**
   * Local, unsaved working copy of the task's subtasks.
   * Two-way bound to `<app-subtask-field [(subtasks)]="currentSubtasks" />`, which adds, renames
   * and removes entries (new entries get temporary ids). Only persisted in `saveTask()`
   * via `TaskService.setTaskSubtasks`.
   */
  currentSubtasks = signal<SubtaskInterface[]>([]);

  /**
   * Full contact objects corresponding to `selectedContactIds()`,
   * used to render the assigned user avatars in the select-field footer.
   */
  selectedContacts = computed(() => {
    const ids = new Set(this.selectedContactIds());
    return this.contactService.sortedContacts().filter((contact) => ids.has(contact.id));
  });

  selectedPrio = signal<Priority>('medium');

  // ---------------------------------------------------------------------------
  // Reactive Form Definition
  // ---------------------------------------------------------------------------

  /**
   * Reactive form group holding the simple editable task fields
   * (`title`, `description`, `dueDate`, `priority`), each of them required.
   * Contacts and subtasks are handled separately via signals.
   */
  taskForm = this.fb.group({
    title: ['', [Validators.required, Validators.maxLength(200)]],
    description: [''],
    dueDate: ['', [Validators.required]],
    priority: this.fb.control<Priority>('medium', { nonNullable: true }),
  });

  /**
   * Re-initializes the local edit state whenever the `task()` input changes:
   * fills `taskForm`, `selectedContactIds` and `currentSubtasks` from the task,
   * or resets all three to empty values if no task is available.
   */
  constructor() {
    effect(() => {
      const currentTask = this.currentTask();
      if (currentTask) {
        this.selectedContactIds.set(currentTask.assigned_users?.map((u) => u.id) ?? []);
        this.currentSubtasks.set(currentTask.subtasks ?? []);
        this.selectedPrio.set(currentTask.priority);

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
   * Toggles a single contact's assignment state locally when clicking an option's checkbox
   * in the select dropdown. Only updates `selectedContactIds`; nothing is saved to the database.
   * Duplicate assignments are prevented.
   *
   * Note: removing a contact via the delete button on an avatar badge in the footer is handled by
   * `SelectFieldComponent.deselect()` (template: `(userDeletedId)="assignedSelect.deselect($event)"`).
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
   * Submit handler of the form (triggered by the "Ok" button).
   *
   * This is the only place where edits are written to the database. In order it:
   * 1. updates the task's `title`, `description` and `due_date` (`TaskService.updateTask`),
   * 2. replaces the contact assignments with `selectedContactIds()` (`TaskService.setTaskAssignments`),
   * 3. replaces the subtasks with `currentSubtasks()` (`TaskService.setTaskSubtasks`),
   * 4. switches back to the task detail dialog (`openDialog('task', ...)`).
   *
   * Form validation is currently not enforced (the `valid` check is commented out).
   *
   * @returns A promise that resolves once all updates are done and the detail view is opened.
   */
  async saveTask(): Promise<void> {
    // if (!this.taskForm.valid) return;
    const currentTaskId = this.currentTask()?.id;
    const rawValue = this.taskForm.getRawValue();

    if (currentTaskId && rawValue) {
      await this.taskService.updateTask(currentTaskId, {
        title: rawValue.title!,
        description: rawValue.description!,
        due_date: rawValue.dueDate!,
        priority: rawValue.priority,
      });

      await this.taskService.setTaskAssignments(currentTaskId, this.selectedContactIds());
      await this.taskService.setTaskSubtasks(currentTaskId, this.currentSubtasks());
    }

    const updatedTask = this.taskService.tasks().find((t) => t.id === currentTaskId);
    this.dialogService.openDialog('task', updatedTask);
  }
}
