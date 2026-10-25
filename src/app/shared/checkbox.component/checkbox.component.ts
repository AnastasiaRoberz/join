import {
  ChangeDetectorRef,
  Component,
  computed,
  contentChild,
  effect,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { ErrorService } from '../../services/error.service';
import { NgControl } from '@angular/forms';

let nextId = 0;

@Component({
  imports: [],
  selector: 'app-checkbox',
  styleUrl: './checkbox.component.scss',
  templateUrl: './checkbox.component.html',
})
export class CheckboxComponent {
  errorService = inject(ErrorService);

  ngControl = contentChild(NgControl);
  text = input<string | null>(null);
  checkedInput = input<boolean>(false, { alias: 'checked' });
  checkedChange = output<boolean>();

  checked = signal<boolean>(false);

  constructor() {
    effect(() => {
      this.checked.set(this.checkedInput());
    });

    effect((onCleanUp) => {
      const ctrl = this.ngControl()?.control;
      if (ctrl) {
        this.checked.set(Boolean(ctrl.value));
        const sub = ctrl.valueChanges.subscribe((value) => {
          this.checked.set(Boolean(value));
        });
        onCleanUp(() => sub.unsubscribe());
      }
    });
  }

  onInputChange(event: Event): void {
    const target = event.target as HTMLInputElement;
    if (target) {
      this.checked.set(target.checked);
      this.checkedChange.emit(target.checked);
    }
  }

  iconHref = computed(() =>
    this.checked()
      ? './assets/icons/icons.svg#checkbox-checked'
      : './assets/icons/icons.svg#checkbox-empty',
  );

  showError(): string | null {
    const ctrl = this.ngControl()?.control;

    if (!ctrl || !ctrl.invalid || !ctrl.touched) return null;

    return this.errorService.getErrorMessage(ctrl.errors, '');
  }
}
