import {
  ChangeDetectorRef,
  Component,
  computed,
  contentChild,
  DestroyRef,
  effect,
  inject,
  input,
  output,
} from '@angular/core';
import { ErrorService } from '../../services/error.service';
import { NgControl } from '@angular/forms';
import { ResponsiveService } from '../../services/responsive.service';

let nextId = 0;

@Component({
  imports: [],
  selector: 'app-text-field',
  styleUrl: './text-field.scss',
  templateUrl: './text-field.html',
  host: {
    '[class.is-mobile]': 'responsiveService.isMobile()',
  },
})
export class TextField {
  errorService = inject(ErrorService);
  responsiveService = inject(ResponsiveService);
  cdr = inject(ChangeDetectorRef);

  ngControl = contentChild(NgControl);
  label = input<string>();
  icon = input<string>();
  type = input<string>('text');
  id = input<string>(`app-input-${nextId++}`);
  labelPos = input<string>('inner');

  iconClick = output<void>();

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

  onIconClick(event: MouseEvent): void {
    event.stopPropagation();
    this.iconClick.emit();
  }

  showError(): string | null {
    const ctrl = this.ngControl()?.control;

    if (!ctrl || !ctrl.invalid || !ctrl.touched) return null;

    return this.errorService.getErrorMessage(ctrl.errors, this.label() ?? '');
  }
}
