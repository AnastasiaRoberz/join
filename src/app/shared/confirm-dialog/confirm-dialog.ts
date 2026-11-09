import {
  afterNextRender,
  Component,
  effect,
  ElementRef,
  inject,
  Injector,
  viewChild,
} from '@angular/core';
import { ConfirmService } from '../../services/confirm.service';
import { Buttons } from '../button.component/button.component';

/**
 * Overlay with a question and two buttons (cancel / confirm).
 * Is controlled by the `ConfirmService`, so it only needs to be placed once in the app.
 *
 * @example
 * <app-confirm-dialog />
 */
@Component({
  imports: [Buttons],
  selector: 'app-confirm-dialog',
  styleUrl: './confirm-dialog.scss',
  templateUrl: './confirm-dialog.html',
})
export class ConfirmDialog {
  confirmService = inject(ConfirmService);

  //für afterNextRender
  injector = inject(Injector);

  // Referenz auf die <section> im Template
  dialogBox = viewChild<ElementRef>('dialogBox');

  constructor() {
    //setzt Fokus auf den Dialog nach dem Öffnen
    effect(() => {
      if (this.confirmService.request()) {
        // afterNextRender: wartet bis Angular das DOM aktualisiert hat
        afterNextRender(
          () => {
            this.dialogBox()?.nativeElement.focus();
          },
          { injector: this.injector },
        );
      }
    });
  }
}
