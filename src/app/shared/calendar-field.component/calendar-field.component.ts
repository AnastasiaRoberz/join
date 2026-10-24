import { ChangeDetectorRef, Component, effect, inject, input, ViewChild } from '@angular/core';
import { FlatpickrDirective } from '../../directives/flatpickr.directive';
import { ResponsiveService } from '../../services/responsive.service';
import { ControlValueAccessor, NgControl, ReactiveFormsModule } from '@angular/forms';
import { ErrorService } from '../../services/error.service';

let nextId = 0;

@Component({
  imports: [FlatpickrDirective, ReactiveFormsModule],
  selector: 'app-calendar-field',
  styleUrl: './calendar-field.component.scss',
  templateUrl: './calendar-field.component.html',
})
export class CalendarFieldComponent implements ControlValueAccessor {
  responsiveService = inject(ResponsiveService);
  errorService = inject(ErrorService);
  cdr = inject(ChangeDetectorRef);

  ngControl = inject(NgControl);
  label = input<string>();
  id = input<string>(`app-calendar-${nextId++}`);

  value: string = '';

  onChange: (value: string) => void = () => {};
  onTouched: () => void = () => {};

  constructor() {
    if (this.ngControl) {
      this.ngControl.valueAccessor = this;
    }

    effect((onCleanUp) => {
      const ctrl = this.ngControl.control;
      if (ctrl) {
        const sub = ctrl.events.subscribe(() => {
          this.cdr.markForCheck();
        });
        onCleanUp(() => sub.unsubscribe());
      }
    });
  }

  @ViewChild('picker') picker!: FlatpickrDirective;
  writeValue(value: string): void {
    this.value = value ?? '';
    if (this.picker) {
      this.picker.setDate(this.value);
    }
    this.cdr.markForCheck();
  }

  onDateSelect(dateStr: string): void {
    this.value = dateStr;
    this.onChange(dateStr);
    this.onTouched();
    this.cdr.markForCheck();
  }

  registerOnChange(fn: (value: string) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  showError(): string | null {
    const ctrl = this.ngControl.control;

    if (!ctrl || !ctrl.invalid || !ctrl.touched) return null;

    return this.errorService.getErrorMessage(ctrl.errors, this.label() ?? '');
  }
}
