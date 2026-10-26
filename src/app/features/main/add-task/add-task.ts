import { Component, ElementRef, inject, signal, ViewChild } from '@angular/core';
import { Buttons } from '../../../shared/button.component/button.component';
import { Priority, PriorityBtn } from '../../../shared/priority-btn/priority-btn';
import { FormControl, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Dropdown } from './components/dropdown/dropdown';
import { ContactInterface } from '../../../interfaces/contact.interface';
import { UserAvatar } from '../../../shared/user-avatar/user-avatar';
import { ResponsiveService } from '../../../services/responsive.service';
import { TaskService } from '../../../services/task.service';
import { TaskInterface } from '../../../interfaces/task.interface';

/**
 * Form component for creating a new task.
 *
 * Collects title, description, due date, priority, category and assigned contacts.
 * On submit, the task is saved via `TaskService`, the selected contacts are linked
 * to it, and the form is reset.
 */
@Component({
  imports: [Dropdown, Buttons, PriorityBtn, ReactiveFormsModule, UserAvatar],
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
    category: new FormControl('', Validators.required),
    subtask: new FormControl(''),
  });

  /** Provides responsive layout information. */
  responsiveService = inject(ResponsiveService);

  /** Used to create the task and to assign contacts to it. */
  taskService = inject(TaskService);

  /** Whether the category dropdown is open. */
  categoryOpen = signal(false);

  /** Whether the contact dropdown is open. */
  assignedOpen = signal(false);

  /** Contacts currently selected for assignment. */
  assignedContacts = signal<ContactInterface[]>([]);

  /** Priority selected via the priority buttons, `null` if none is selected. */
  selectedPrio = signal<Priority | null>(null);

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

  /** Opens or closes the category dropdown. */
  toggleCategory() {
    this.categoryOpen.update((v) => !v);
  }

  /** Opens or closes the contact dropdown. */
  toggleAssigned() {
    this.assignedOpen.update((v) => !v);
  }

  /**
   * Writes the chosen category into the form and closes the category dropdown.
   *
   * @param value - The selected category
   */
  onCategorySelected(value: string) {
    this.taskForm.get('category')?.setValue(value);
    this.categoryOpen.set(false);
  }

  /**
   * Stores the updated contact selection coming from the dropdown.
   *
   * @param contacts - The currently selected contacts
   */
  onContactsSelected(contacts: ContactInterface[]) {
    this.assignedContacts.set(contacts);
  }

  onClear(): void {
    this.taskForm.reset();
    this.selectedPrio.set(null);
    this.assignedContacts.set([]);
    this.categoryOpen.set(false);
    this.assignedOpen.set(false);
  }

  /**
   * Submits the form. Aborts if the form is invalid or no priority is selected.
   * Otherwise it converts the date to `yyyy-mm-dd` (database format), creates the task
   * with status `'To do'`, assigns the selected contacts one by one via the
   * task-assignment table, and finally resets the form and all signals.
   *
   * @returns A promise that resolves when the task and its assignments are saved
   */
  async onSubmit(): Promise<void> {
    if (this.taskForm.invalid || !this.selectedPrio()) {
      this.taskForm.markAllAsTouched();
      return;
    }

    const [day, month, year] = this.taskForm.value.date!.split('/');
    const dateValue = `${year}-${month}-${day}`;
    const task: Omit<TaskInterface, 'id' | 'assigned_users' | 'subtasks'> = {
      title: this.taskForm.value.title!,
      description: this.taskForm.value.description ?? '',
      due_date: dateValue,
      priority: this.selectedPrio()!,
      category: this.taskForm.value.category! as 'User Story' | 'Technical Task',
      status: 'To do',
    };

    const newTaskId = await this.taskService.addTask(task);

    if (newTaskId) {
      for (const contact of this.assignedContacts()) {
        await this.taskService.assignUser(newTaskId, contact.id);
      }

      this.onClear();
    }
  }
}
