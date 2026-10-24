import { Directive, ElementRef, inject, signal } from '@angular/core';
import { NgControl } from '@angular/forms';
import flatpickr from 'flatpickr';

@Directive({
  selector: '[appFlatpickr]',
  standalone: true,
  exportAs: 'appFlatpickr',
})
export class FlatpickrDirective {
  element = inject(ElementRef<HTMLInputElement>);
  ngControl = inject(NgControl);
  picker?: flatpickr.Instance;

  isOpen = signal<boolean>(false);

  ngOnInit(): void {
    this.picker = flatpickr(this.element.nativeElement, {
      dateFormat: 'dd.mm.YYYY',
      disableMobile: true,
      allowInput: true,
      clickOpens: false,
      onChange: (selectedDatees, dateStr) => {
        const ctrl = this.ngControl?.control;
        if (ctrl) {
          ctrl.setValue(dateStr);
          ctrl.markAsDirty();
        }
      },
      onClose: () => {
        const ctrl = this.ngControl?.control;
        if (ctrl) {
          ctrl.markAsTouched();
        }
      },
    });
  }

  toggle(): void {
    if (!this.isOpen()) {
      this.picker?.open();
      this.isOpen.set(true);
    } else {
      this.picker?.close();
      this.isOpen.set(false);
    }
  }

  ngOnDestroy(): void {
    this.picker?.destroy();
  }
}
