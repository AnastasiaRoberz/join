import { Component, ElementRef, signal, ViewChild } from '@angular/core';
import { Buttons } from '../../../shared/button.component/button.component';
import { PriorityBtn } from '../../../shared/priority-btn/priority-btn';
import { FormControl, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';

@Component({
  imports: [Buttons, PriorityBtn, ReactiveFormsModule],
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

  pickerOpen = false;

  @ViewChild('datePickerRef') datePickerRef!: ElementRef<HTMLInputElement>; //nie undefined, keine if-Prüfung nötig

  openDatePicker() {
    if (this.pickerOpen) {
      this.pickerOpen = false;
      return;
    }
    this.pickerOpen = true;
    this.datePickerRef.nativeElement.showPicker();
  }

  onDateSelected(event: Event) {
    const input = event.target as HTMLInputElement; //Auslöser vom Event als HTML-Input
    const raw = input.value;

    if (raw) {
      const [year, month, day] = raw.split('-');
      const formatted = `${day}/${month}/${year}`;
      this.taskForm.controls.date.setValue(formatted);
    }
  }

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
}
