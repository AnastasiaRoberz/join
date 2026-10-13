import { ChangeDetectorRef, Component, DestroyRef, inject, input } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { AbstractControl } from '@angular/forms';

@Component({
  imports: [],
  selector: 'app-error-handler',
  styleUrl: './error-handler.scss',
  templateUrl: './error-handler.html',
})
export class ErrorHandler {
  control = input<AbstractControl | null>(null);
  fieldKey = input.required<string>();

  cdr = inject(ChangeDetectorRef);
  destroyRef = inject(DestroyRef);

  ngOnInit(): void {
    const ctrl = this.control();
    if (ctrl) {
      ctrl.statusChanges.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => {
        this.cdr.markForCheck();
      });
    }
  }

  showErrors(): boolean {
    const ctrl = this.control();
    return !!ctrl;
  }
}
