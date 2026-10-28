import { Component, computed, ElementRef, inject, signal, ViewChild } from '@angular/core';
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
  ],
  selector: 'article[app-add-task]',
  styleUrl: './add-task.scss',
  templateUrl: './add-task.html',
})
export class AddTask {
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

  // /** Whether the category dropdown is open. */
  // categoryOpen = signal(false);

  // /** Whether the contact dropdown is open. */
  // assignedOpen = signal(false);

  /** Contacts currently selected for assignment. */
  assignedContacts = signal<ContactInterface[]>([]);

  /** Priority selected via the priority buttons, `null` if none is selected. */
  selectedPrio = signal<Priority>('medium');

  selectedCategory = signal<string>('');

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

  //#region  --------- Date-Picker Input-Field -------------

  /**
   * Flag used by `openDatePicker()` to toggle the native date picker.
   * Reset via the `blur` event on the hidden date input when the picker closes.
   */
  pickerOpen = false;

  /**
   * Reference to the hidden native date input (`#datePickerRef`).
   * Available once the view has been initialized, so it can be used in event handlers
   * without an undefined check.
   */
  @ViewChild('datePickerRef') datePickerRef!: ElementRef<HTMLInputElement>;

  /**
   * Opens the native date picker of the hidden date input when the calendar button
   * is clicked.
   */
  openDatePicker() {
    this.pickerOpen = true;
    this.datePickerRef.nativeElement.showPicker();
  }

  /**
   * Handles a date chosen in the native date picker. Converts the value from
   * `yyyy-mm-dd` to `dd/mm/yyyy` and writes it into the `date` form control.
   *
   * @param event - The change event of the hidden date input
   */
  onDateSelected(event: Event) {
    const input = event.target as HTMLInputElement; //Auslöser vom Event als HTML-Input
    const raw = input.value;

    if (raw) {
      const [year, month, day] = raw.split('-');
      const formatted = `${day}/${month}/${year}`;
      this.taskForm.controls.date.setValue(formatted);
    }
  }

  /**
   * Formats the text input while typing as `dd/mm/yyyy`: removes all non-digit
   * characters, inserts the slashes and limits the value to 10 characters.
   * Updates the `date` form control without emitting a value change.
   *
   * @param event - The input event of the date text field
   */
  formatDateInput(event: Event) {
    const input = event.target as HTMLInputElement;
    const isDeleting = (event as InputEvent).inputType?.startsWith('delete');

    let value = input.value.replace(/\D/g, ''); //alles, außer Ziffern, ersetzen
    if (!isDeleting) {
      if (value.length > 2) {
        value = value.slice(0, 2) + '/' + value.slice(2);
      }
      if (value.length > 5) {
        value = value.slice(0, 5) + '/' + value.slice(5);
      }
    }

    value = value.slice(0, 10);
    input.value = value;
    this.taskForm.controls.date.setValue(value, { emitEvent: false });
  }

  //#endregion

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

  onCategoryChange(value: string): void {
    this.selectedCategory.set(value);
    this.taskForm.controls.category.setValue(value);
    this.taskForm.controls.category.markAsDirty;
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

    const [day, month, year] = this.taskForm.value.date!.split('/');
    const dateValue = `${year}-${month}-${day}`;
    const task: Omit<TaskInterface, 'id' | 'assigned_users' | 'subtasks'> = {
      title: this.taskForm.value.title!,
      description: this.taskForm.value.description ?? '',
      due_date: dateValue,
      priority: this.selectedPrio(),
      category: this.taskForm.value.category! as 'User Story' | 'Technical Task',
      status: 'To do',
    };

    const newTaskId = await this.taskService.addTask(task);

    if (newTaskId) {
      const contactIds = this.selectedContactIds();
      await this.taskService.setTaskAssignment(newTaskId, contactIds);

      this.onClear();
    }
  }
}
