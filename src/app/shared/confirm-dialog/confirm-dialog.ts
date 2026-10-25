import { Component, inject } from '@angular/core';
import { ConfirmService } from '../../services/confirm.service';

/**
 * Overlay with a question and two buttons (cancel / confirm).
 * Is controlled by the `ConfirmService`, so it only needs to be placed once in the app.
 *
 * @example
 * <app-confirm-dialog />
 */
@Component({
  imports: [],
  selector: 'app-confirm-dialog',
  styleUrl: './confirm-dialog.scss',
  templateUrl: './confirm-dialog.html',
})
export class ConfirmDialog {
  confirmService = inject(ConfirmService);
}