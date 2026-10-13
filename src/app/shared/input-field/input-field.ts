import {
  ChangeDetectorRef,
  Component,
  contentChild,
  DestroyRef,
  effect,
  inject,
  input,
} from '@angular/core';
import { ErrorService } from '../../services/error-service';
import { NgControl } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { JsonPipe } from '@angular/common';

@Component({
  imports: [JsonPipe],
  selector: 'app-input-field',
  styleUrl: './input-field.scss',
  templateUrl: './input-field.html',
})
export class InputField {
  errorService = inject(ErrorService);

  cdr = inject(ChangeDetectorRef);
  destroyRef = inject(DestroyRef);

  ngControl = contentChild(NgControl);
  label = input<string>('');
  icon = input<string>('');
  type = input<string>('text');

  constructor() {
    effect(() => {
      const ctrl = this.ngControl()?.control;
      if (ctrl) {
        ctrl.statusChanges.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => {
          this.cdr.markForCheck();
        });
      }
    });
  }

  showError(): string | null {
    const ctrl = this.ngControl()?.control;

    if (!(ctrl && ctrl.invalid && (ctrl.touched || ctrl.dirty))) return null;

    return this.errorService.getErrorMessage(ctrl.errors, this.label());
  }
}
