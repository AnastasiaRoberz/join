import { Component, ElementRef, signal, ViewChild } from '@angular/core';
import { Buttons } from '../../../shared/button.component/button.component';
import { Priority, PriorityBtn } from '../../../shared/priority-btn/priority-btn';
import { FormControl, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Dropdown } from './components/dropdown/dropdown';

@Component({
  imports: [Dropdown, Buttons, PriorityBtn, ReactiveFormsModule],
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

  categoryOpen = signal(false);
  assignedOpen = signal(false);

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

  // onSubmit(): void {
  //   const task = {
  //     ...this.taskForm.value,
  //     priority: this.selectedPrio(),
  //   };
  // }
}
