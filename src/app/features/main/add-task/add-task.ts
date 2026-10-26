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

@Component({
  imports: [Dropdown, Buttons, PriorityBtn, ReactiveFormsModule, UserAvatar],
  selector: 'article[app-add-task]',
  styleUrl: './add-task.scss',
  templateUrl: './add-task.html',
})
export class AddTask {
  taskForm = new FormGroup({
    title: new FormControl('', Validators.required),
    description: new FormControl(''),
    date: new FormControl('', Validators.required),
    assigned: new FormControl(''),
    category: new FormControl('', Validators.required),
    subtask: new FormControl(''),
  });

  responsiveService = inject(ResponsiveService);
  taskService = inject(TaskService);

  categoryOpen = signal(false);
  assignedOpen = signal(false);

  assignedContacts = signal<ContactInterface[]>([]);

  //prio selected with prio-btn, null when nothing selected
  selectedPrio = signal<Priority | null>(null);

  //#region  --------- Date-Picker Input-Field -------------

  //date-picker from date-input-field
  pickerOpen = false;

  @ViewChild('datePickerRef') datePickerRef!: ElementRef<HTMLInputElement>; //nie undefined, keine if-Prüfung nötig

  //svg-calendar-btn opens date-picker from hidden date-input-field (toggle)
  openDatePicker() {
    if (this.pickerOpen) {
      this.pickerOpen = false;
      return;
    }
    this.pickerOpen = true;
    this.datePickerRef.nativeElement.showPicker();
  }

  //
  onDateSelected(event: Event) {
    const input = event.target as HTMLInputElement; //Auslöser vom Event als HTML-Input
    const raw = input.value;

    if (raw) {
      const [year, month, day] = raw.split('-');
      const formatted = `${day}/${month}/${year}`;
      this.taskForm.controls.date.setValue(formatted);
    }
  }

  //format numbers put in text-input-field as date: dd/mm/yyyy (10 symbols)
  formatDateInput(event: Event) {
    const input = event.target as HTMLInputElement;

    let value = input.value.replace(/\D/g, ''); //alles, außer Ziffern, ersetzen
    if (value.length > 2) {
      value = value.slice(0, 2) + '/' + value.slice(2);
    }
    if (value.length > 5) {
      value = value.slice(0, 5) + '/' + value.slice(5);
    }

    value = value.slice(0, 10);
    input.value = value;
    this.taskForm.controls.date.setValue(value, { emitEvent: false });
  }

  //#endregion

  onPrioritySelected(prio: Priority): void {
    this.selectedPrio.set(prio);
  }

  toggleCategory() {
    this.categoryOpen.update((v) => !v);
  }

  toggleAssigned() {
    this.assignedOpen.update((v) => !v);
  }

  onCategorySelected(value: string) {
    this.taskForm.get('category')?.setValue(value);
    this.categoryOpen.set(false);
  }

  onContactsSelected(contacts: ContactInterface[]) {
    this.assignedContacts.set(contacts);
  }

  async onSubmit(): Promise<void> {
    if (this.taskForm.invalid || !this.selectedPrio()) return; //abbrechen wenn Formular ungültig/ keine prio gewählt

    const [day, month, year] = this.taskForm.value.date!.split('/'); // split / vom Date, linken array befüllen
    const dateValue = new Date(+year, +month - 1, +day); //+ wandelt string in number um, -1 für Date: JS-Monate beginnen mit 0
    const task: Omit<TaskInterface, 'id'> = {
      title: this.taskForm.value.title!,
      description: this.taskForm.value.description ?? '',
      due_date: dateValue,
      priority: this.selectedPrio()!,
      category: this.taskForm.value.category! as 'User Story' | 'Technical Task',
      status: 'To do',
      subtasks: [],
      assigned_users: this.assignedContacts(),
    };

    await this.taskService.addTask(task);
  }
}
