import { Component, inject } from '@angular/core';
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
}
