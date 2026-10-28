import { Component, computed, effect, inject, signal } from '@angular/core';
import { DialogService } from '../../services/dialog.service';
import { ContactDialog } from '../../features/main/contacts/components/contact-dialog/contact-dialog';
import { TaskDetails } from '../../features/main/board/components/task-details/task-details';
import { TaskEdit } from '../../features/main/board/components/task-edit/task-edit';
import { Buttons } from '../button.component/button.component';
import { TaskInterface } from '../../interfaces/task.interface';
import { ContactInterface } from '../../interfaces/contact.interface';

/**
 * Global modal overlay that hosts the currently active dialog content.
 *
 * The visible content is chosen by `DialogService.dialogType()`
 * (`'contact'` → `ContactDialog`, `'task'` → `TaskDetails`, `'task-edit'` → `TaskEdit`;
 * the type `'add-task'` has no case in the template yet and renders nothing).
 * `DialogService.selectedItem()` is passed to the content as its data (contact or task).
 *
 * Open/close behavior (via host bindings):
 * - The `is-open` CSS class is toggled by `DialogService.isOpen()`.
 * - A click on the overlay (backdrop) closes the dialog; clicks inside `.overlay-content`
 *   are stopped from bubbling, so they do not close it.
 *
 * Place it once, e.g. in the app shell, and control it only through `DialogService`.
 *
 * @example
 * ```html
 * <app-dialog />
 * ```
 * ```ts
 * dialogService.openDialog('task-edit', task); // show the task edit form
 * dialogService.closeDialog();                 // hide the dialog
 * ```
 */
@Component({
  imports: [ContactDialog, TaskEdit, Buttons, TaskDetails],
  selector: 'app-dialog',
  styleUrl: './dialog.component.scss',
  templateUrl: './dialog.component.html',
  host: {
    '(click)': 'dialogService.closeDialog()',
    '[class.is-open]': 'dialogService.isOpen()',
  },
})
export class DialogComponent {
  /** Provides the dialog state (open flag, type, selected item) and `closeDialog()` for the backdrop click. */
  dialogService = inject(DialogService);

  handleClose(): void {
    if (this.dialogService.dialogType() === 'task-edit') {
      this.dialogService.openDialog('task', this.dialogService.selectedItem());
    } else {
      this.dialogService.closeDialog();
    }
  }
}
