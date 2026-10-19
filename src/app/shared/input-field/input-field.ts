import {
  ChangeDetectorRef,
  Component,
  contentChild,
  DestroyRef,
  effect,
  inject,
  input,
} from '@angular/core';
import { ErrorService } from '../../services/error.service';
import { NgControl } from '@angular/forms';

let nextId = 0;

@Component({
  imports: [],
  selector: 'app-input-field',
  styleUrl: './input-field.scss',
  templateUrl: './input-field.html',
})
export class InputField {
  errorService = inject(ErrorService);
  cdr = inject(ChangeDetectorRef);

  ngControl = contentChild(NgControl);
  label = input<string>('');
  icon = input<string>('');
  type = input<string>('text');
  id = input<string>(`app-input-${nextId++}`);

  constructor() {
    effect((onCleanUp) => {
      const ctrl = this.ngControl()?.control;
      if (ctrl) {
        const sub = ctrl.events.subscribe(() => {
          this.cdr.markForCheck();
        });
        onCleanUp(() => sub.unsubscribe());
      }
    });
  }

  showError(): string | null {
    const ctrl = this.ngControl()?.control;

    if (!ctrl || !ctrl.invalid || !ctrl.touched) return null;

    return this.errorService.getErrorMessage(ctrl.errors, this.label());
  }
}
