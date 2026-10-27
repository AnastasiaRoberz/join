import { ChangeDetectorRef, Component, effect, inject, input } from '@angular/core';
import { ErrorService } from '../../services/error.service';
import { ControlValueAccessor, NgControl, ReactiveFormsModule } from '@angular/forms';
import { ResponsiveService } from '../../services/responsive.service';

let nextId = 0;

@Component({
  imports: [ReactiveFormsModule],
  selector: 'app-text-field',
  styleUrl: './text-field.scss',
  templateUrl: './text-field.html',
  host: {
    '[class.is-mobile]': 'responsiveService.isMobile()',
  },
})
export class TextField implements ControlValueAccessor {
  errorService = inject(ErrorService);
  responsiveService = inject(ResponsiveService);
  cdr = inject(ChangeDetectorRef);

  ngControl = inject(NgControl);
  label = input<string>();
  icon = input<string>();
  id = input<string>(`app-input-${nextId++}`);
  labelPos = input<string>('inner');
  type = input<'input' | 'textarea'>('input');
  placeholder = input<string>(' ');

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

  writeValue(value: string): void {
    this.value = value ?? '';
    this.cdr.markForCheck();
  }

  registerOnChange(fn: (value: string) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  onInput(event: Event): void {
    const value = (event.target as HTMLInputElement | HTMLTextAreaElement).value;
    this.value = value;
    this.onChange(value);
  }

  showError(): string | null {
    const ctrl = this.ngControl.control;

    if (!ctrl || !ctrl.invalid || !ctrl.touched) return null;

    return this.errorService.getErrorMessage(ctrl.errors, this.label() ?? '');
  }
}
