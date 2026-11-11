import { Service, signal } from '@angular/core';
import { ContactInterface } from '../interfaces/contact.interface';
import { TaskInterface } from '../interfaces/task.interface';

/** Item the dialog works on: a task, a contact, or `null` (create new / nothing selected). */
export type DialogItem = TaskInterface | ContactInterface | null;

/**
 * Content that the global dialog can display:
 * - `'contact'`: add/edit contact form
 * - `'task'`: task details view
 * - `'task-edit'`: task edit form
 * - `'add-task'`: add task form
 * - `null`: no content (dialog closed/reset)
 */
export type DialogContentType = 'contact' | 'task' | 'task-edit' | 'add-task' | null;

/**
 * Controls the global dialog: whether it is open, which content it shows (`dialogType`)
 * and which item (contact or task) it works on (`selectedItem`). The dialog component
 * reads these signals; any component opens it via `openDialog()`.
 *
 * It also coordinates the selection and scroll behavior for a newly created contact via
 * `selectContact()`, `pendingSelectedId` and `scrollToContact`.
 *
 * @example
 * dialog = inject(DialogService);
 * this.dialog.openDialog('contact');            // create a new contact
 * this.dialog.openDialog('contact', contact);   // edit an existing contact
 * this.dialog.openDialog('task', task);         // show task details
 * this.dialog.closeDialog();
 */
@Service()
export class DialogService {
  /** Whether the dialog is currently open (drives the open/close animation). */
  public readonly isOpen = signal<boolean>(false);
  /** Which content the dialog shows. Stays set during the close animation and is reset to `null` afterwards. */
  public readonly dialogType = signal<DialogContentType>(null);

  /** The item (contact or task, depending on `dialogType`) the dialog works on, or `null` when creating a new one. */
  public readonly selectedItem = signal<DialogItem>(null);

  /**
   * Holds the id of a newly created contact until the Contacts container picks it up.
   * The container reads this in an effect(), sets it as selectedId, then resets it to null.
   */
  public readonly pendingSelectedId = signal<number | null>(null);

  /**
   * True while a newly created contact should be scrolled to.
   * Set to true in selectContact(), reset to false in ContactList after scrolling.
   */
  public readonly scrollToContact = signal<boolean>(false);

  /**
   * True when the dialog is creating a brand-new contact.
   * False when editing an existing one.
   * Used by ContactList to decide whether to auto-scroll after save.
   */
  public readonly isNewContact = signal<boolean>(false);

  /** Handle of the pending state reset started in `closeDialog()`; cleared if the dialog is reopened within 400ms. */
  private closeTimeout?: ReturnType<typeof setTimeout>;

  /**
   * Opens the dialog with the given content. Cancels a pending reset from `closeDialog()`,
   * so reopening during the close animation works correctly.
   * Sets `isNewContact` to true when opening a contact form without an existing item.
   *
   * @param type - Which content to show.
   * @param item - The contact/task to display or edit, or `null` to create a new one.
   */
  public openDialog(type: DialogContentType, item: DialogItem = null): void {
    if (this.closeTimeout) {
      clearTimeout(this.closeTimeout);
    }
    this.dialogType.set(type);
    this.selectedItem.set(item);
    this.isOpen.set(true);

    if (type === 'contact') {
      this.isNewContact.set(item === null);
    }
  }

  /**
   * Closes the dialog. `isOpen` is set to `false` immediately; `dialogType` and `selectedItem`
   * are reset after 400ms so the content stays visible during the close animation.
   */
  public closeDialog(): void {
    this.isOpen.set(false);

    this.closeTimeout = setTimeout(() => {
      this.dialogType.set(null);
      this.selectedItem.set(null);
    }, 400);
  }

  /**
   * Called after a new contact is created. Stores the new contact's id so the
   * Contacts container can select it, and flags it as a new contact for auto-scrolling.
   *
   * @param id - The database id of the newly created contact
   */
  public selectContact(id: number): void {
    this.pendingSelectedId.set(id);
    this.scrollToContact.set(true);
  }
}
