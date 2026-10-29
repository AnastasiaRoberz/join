import { Component, computed, inject, OnDestroy, signal } from '@angular/core';
import { Buttons } from '../../../shared/button.component/button.component';
import { Priority, PriorityBtn } from '../../../shared/priority-btn/priority-btn';
import { FormControl, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { ContactInterface } from '../../../interfaces/contact.interface';
import { UserAvatar } from '../../../shared/user-avatar/user-avatar';
import { ResponsiveService } from '../../../services/responsive.service';
import { TaskService } from '../../../services/task.service';
import { TaskInterface } from '../../../interfaces/task.interface';
import { TextField } from '../../../shared/text-field/text-field';
import { CalendarFieldComponent } from '../../../shared/calendar-field.component/calendar-field.component';
import { SelectFieldComponent } from '../../../shared/select-field.component/select-field.component';
import { ContactService } from '../../../services/contact.service';
import { CATEGORIES } from '../../../utils/categories-list';
import { CheckboxComponent } from '../../../shared/checkbox.component/checkbox.component';
import { AvatarGroupComponent } from '../../../shared/avatar-group.component/avatar-group.component';
import { SubtaskFieldComponent } from '../../../shared/subtask-field.component/subtask-field.component';
import { DialogService } from '../../../services/dialog.service';

/**
 * Form component for creating a new task.
 *
 * Collects title, description, due date, priority, category and assigned contacts.
 * On submit, the task is saved via `TaskService`, the selected contacts are linked
 * to it, and the form is reset.
 */
@Component({
  imports: [
    Buttons,
    PriorityBtn,
    ReactiveFormsModule,
    UserAvatar,
    TextField,
    CalendarFieldComponent,
    SelectFieldComponent,
    CheckboxComponent,
    AvatarGroupComponent,
    SubtaskFieldComponent,
  ],
  selector: 'article[app-add-task]',
  styleUrl: './add-task.scss',
  templateUrl: './add-task.html',
})
export class AddTask implements OnDestroy {
  /**
   * Reactive form of the task. `title`, `date` and `category` are required.
   * The date is stored as text in the format `dd/mm/yyyy`.
   * Contact assignment is handled separately via the `assignedContacts` signal.
   */
  taskForm = new FormGroup({
    title: new FormControl('', Validators.required),
    description: new FormControl(''),
    date: new FormControl('', Validators.required),
    assigned: new FormControl<number[]>([]),
    category: new FormControl('', Validators.required),
    subtask: new FormControl(''),
  });

  /** Provides responsive layout information. */
  responsiveService = inject(ResponsiveService);

  contactService = inject(ContactService);

  /** Used to create the task and to assign contacts to it. */
  taskService = inject(TaskService);

  readonly categories = CATEGORIES;
  categoryKey = (category: (typeof CATEGORIES)[number]) => category.name;

  /** Contacts currently selected for assignment. */
  assignedContacts = signal<ContactInterface[]>([]);

  /** Priority selected via the priority buttons, `null` if none is selected. */
  selectedPrio = signal<Priority>('medium');

  /** Reactive list of currently assigned contact IDs. */
  selectedContactIds = signal<number[]>([]);

  /**
   * Full contact objects corresponding to `selectedContactIds()`,
   * used to render the assigned user avatars in the select-field footer.
   */
  selectedContacts = computed(() => {
    const ids = new Set(this.selectedContactIds());
    return this.contactService.sortedContacts().filter((contact) => ids.has(contact.id));
  });

  /**
   * Extraction function passed to `<app-select-field [getSearchStrings]>`
   * so contacts can be filtered by either first name or surname.
   *
   * @param contact - The contact item to extract searchable strings from.
   * @returns An array containing the contact's first name and surname.
   */
  contactSearchStrings = (contact: ContactInterface): string[] => [
    contact.firstname,
    contact.surname,
  ];

  /**
   * Returns `true` if the given form control is invalid and has been
   * touched or dirtied by the user. Used by the template to show error hints.
   *
   * @param controlName - The name of the form control to check
   */
  showError(controlName: string): boolean {
    const control = this.taskForm.get(controlName);
    return !!control && control.invalid && (control.touched || control.dirty);
  }

  /**
   * Stores the priority chosen via a priority button.
   *
   * @param prio - The selected priority
   */
  onPrioritySelected(prio: Priority): void {
    this.selectedPrio.set(prio);
  }

  /**
   * Updates both the `selectedContactIds` signal and the `assignedTo` form control
   * when the selection changes via the `<app-select-field>` listbox.
   *
   * @param ids - The updated array of selected contact IDs.
   */
  onAssignmentChange(ids: number[]): void {
    this.selectedContactIds.set(ids);
    this.taskForm.controls.assigned.setValue(ids);
    this.taskForm.controls.assigned.markAsDirty();
  }

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

    this.onAssignmentChange(updatedIds);
  }

  /**
   * Resets the form and all related signals to their initial state.
   * Called by the Clear button and at the end of a successful submit.
   */
  onClear(): void {
    this.taskForm.reset();
    this.selectedPrio.set('medium');
    this.assignedContacts.set([]);
    this.selectedContactIds.set([]);
  }

  /** Holds the status chosen via a column "+" button. */
  dialogService = inject(DialogService);

  /**
   * Submits the form. If the form is invalid or no priority is selected,
   * all fields are marked as touched to reveal error hints and the method aborts.
   * Otherwise it converts the date to `yyyy-mm-dd` (database format), creates the task
   * with status `'To do'`, assigns the selected contacts one by one via the
   * task-assignment table, and finally resets the form via `onClear`.
   *
   * @returns A promise that resolves when the task and its assignments are saved
   */
  async onSubmit(): Promise<void> {
    if (this.taskForm.invalid) {
      this.taskForm.markAllAsTouched();
      return;
    }

    const status = this.dialogService.addTaskStatus(); // adding the status
    // find all tasks of that status / column
    const columnTasks = this.taskService.tasks().filter((task) => task.status === status);

    /** one above the current top task, so the new task always lands first. */
    // identify task positions in column and get smallest position, apply -1 from there or applues 0 if empty column
    const top = columnTasks.length ? Math.min(...columnTasks.map((task) => task.position)) - 1 : 0;

    const task: Omit<TaskInterface, 'id' | 'assigned_users' | 'subtasks'> = {
      title: this.taskForm.value.title!,
      description: this.taskForm.value.description ?? '',
      due_date: this.taskForm.value.date!,
      priority: this.selectedPrio(),
      category: this.taskForm.value.category! as 'User Story' | 'Technical Task',
      status: this.dialogService.addTaskStatus(),
      position: top, // assigning top position
    };

    const newTask = await this.taskService.addTask(task);

    if (newTask) {
      const contactIds = this.selectedContactIds();
      await this.taskService.setTaskAssignments(newTask.id, contactIds);

      this.onClear();
    }
  }

  /** Resets the column status so the next task starts in "To do" again. */
  // needed for the add task link on the sidebar, as that is never the overlay and does not call the dialogservice
  ngOnDestroy(): void {
    this.dialogService.addTaskStatus.set('To do');
  }
}
