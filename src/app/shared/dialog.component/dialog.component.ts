import { Component, computed, effect, inject } from '@angular/core';
import { DialogService } from '../../services/dialog.service';
import { ContactDialog } from '../../features/main/contacts/components/contact-dialog/contact-dialog';
import { TaskDetails } from '../../features/main/board/components/task-details/task-details';
import { TaskEdit } from '../../features/main/board/components/task-edit/task-edit';
import { Buttons } from '../button.component/button.component';
import { AddTask } from '../../features/main/add-task/add-task';
import { ResponsiveService } from '../../services/responsive.service';

/** Accessible labels mapped by dialog type. */
const DIALOG_LABELS: Record<string, string> = {
  contact: 'Contact details',
  task: 'Task details',
  'task-edit': 'Edit task',
  'add-task': 'Add task',
};

/**
 * Global modal overlay that hosts the currently active dialog content.
 *
 * The visible content is chosen by `DialogService.dialogType()`
 * (`'contact'` -> `ContactDialog`, `'task'` -> `TaskDetails`, `'task-edit'` -> `TaskEdit`,
 * `'add-task'` -> `AddTask`).
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
  /** Provides the dialog state (open flag, type, selected item) and `closeDialog()` for backdrop clicks. */
  protected readonly dialogService = inject(DialogService);

  /** Responsive service used to close desktop/tablet overlays on viewport transitions. */
  private readonly responsiveService = inject(ResponsiveService);

  /** Tracks whether the mousedown event initiated inside dialog content to avoid backdrop dismissal. */
  private mousedownInside = false;

  /** Dynamic aria-label for accessibility based on active dialog type. */
  protected readonly dialogLabel = computed<string>(() => {
    const type = this.dialogService.dialogType();
    return (type && DIALOG_LABELS[type]) ?? 'Dialog';
  });

  /** Indicates whether the close button should appear white on mobile for contact dialogs. */
  protected readonly whiteBtn = computed<boolean>(() => {
    return this.responsiveService.isMobile() && this.dialogService.dialogType() === 'contact';
  });

  /** Initializes tablet viewport change listener to automatically close dialogs when needed. */
  constructor() {
    this.initTabletCloseEffect();
  }

  /** Marks that a mousedown event occurred within the dialog content. */
  protected onContentMousedown(): void {
    this.mousedownInside = true;
  }

  /** Resets mousedown flag so subsequent backdrop clicks function immediately. */
  protected onContentMouseUp(): void {
    this.mousedownInside = false;
  }

  /** Closes dialog or navigates back when the backdrop overlay is clicked. */
  protected onBackdropClick(): void {
    if (this.mousedownInside) {
      this.mousedownInside = false;
      return;
    }
    this.handleClose();
  }

  /** Handles close button or backdrop click, navigating back to task details when in edit mode. */
  protected handleClose(): void {
    if (this.dialogService.dialogType() === 'task-edit') {
      this.dialogService.openDialog('task', this.dialogService.selectedItem());
    } else {
      this.dialogService.closeDialog();
    }
  }

  /** Closes add-task dialog on tablet viewports where add-task is a dedicated page. */
  private initTabletCloseEffect(): void {
    effect(() => {
      const onTablet = this.responsiveService.isTablet();
      if (onTablet && this.dialogService.dialogType() === 'add-task') {
        this.dialogService.closeDialog();
      }
    });
  }
}
