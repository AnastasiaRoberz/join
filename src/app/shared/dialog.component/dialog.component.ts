import { Component, computed, effect, inject } from '@angular/core';
import { DialogService } from '../../services/dialog.service';
import { ContactDialog } from '../../features/main/contacts/components/contact-dialog/contact-dialog';
import { TaskDetails } from '../../features/main/board/components/task-details/task-details';
import { TaskEdit } from '../../features/main/board/components/task-edit/task-edit';
import { Buttons } from '../button.component/button.component';
import { AddTask } from '../../features/main/add-task/add-task';
import { ResponsiveService } from '../../services/responsive.service';
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
  imports: [ContactDialog, TaskEdit, Buttons, TaskDetails, AddTask],
  selector: 'app-dialog',
  styleUrl: './dialog.component.scss',
  templateUrl: './dialog.component.html',
  host: {
    '(click)': 'onBackdropClick()',
    '[class.is-open]': 'dialogService.isOpen()',
  },
})
export class DialogComponent {
  /** Provides the dialog state (open flag, type, selected item) and `closeDialog()` for the backdrop click. */
  dialogService = inject(DialogService);
  responsiveService = inject(ResponsiveService);

  //ist false, wenn noch kein click innerhalb dialog erfolgt
  private mousedownInside = false;

  //Click innerhalb Dialog: mousedown-event über html setzt property mousedownInside auf true
  onContentMousedown(): void {
    this.mousedownInside = true;
  }

  //Click innerhalb Dialog: wenn noch IM Dialog mousup-event: property wieder auf false, damit click backdrop sofort wieder funktioniert
  onContentMouseUp(): void {
    this.mousedownInside = false;
  }

  //über click auf host: wenn click backdrop: close wird aufgerufen, außer click innerhalb dialog true, dann return
  onBackdropClick(): void {
    if (this.mousedownInside) {
      this.mousedownInside = false;
      return;
    }
    this.handleClose();
  }

  whiteBtn = computed(() => {
    return this.responsiveService.isMobile() && this.dialogService.dialogType() === 'contact';
  });

  constructor() {
    effect(() => {
      const onTablet = this.responsiveService.isTablet();
      if (onTablet && this.dialogService.dialogType() === 'add-task') {
        this.dialogService.closeDialog();
      }
    });
  }

  handleClose(): void {
    if (this.dialogService.dialogType() === 'task-edit') {
      this.dialogService.openDialog('task', this.dialogService.selectedItem());
    } else {
      this.dialogService.closeDialog();
    }
  }
}
