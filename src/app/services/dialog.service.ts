import { Service, signal } from '@angular/core';
import { ContactInterface } from '../interfaces/contact.interface';
import { TaskInterface } from '../interfaces/task.interface';

export type DialogContentType = 'contact' | 'task' | 'task-edit' | 'add-task' | null;

/**
 * Manages the state of the contact dialog (open/closed, which contact is being edited)
 * and coordinates post-creation selection and scroll behavior via signals.
 */
@Service()
export class DialogService {
  /** Whether the contact dialog is currently open. */
  isOpen = signal<boolean>(false);
  dialogType = signal<DialogContentType>(null);

  /** The contact currently being edited, or null when creating a new one. */
  selectedItem = signal<any | null>(null);

  /**
   * Holds the id of a newly created contact until the Contacts container picks it up.
   * The container reads this in an effect(), sets it as selectedId, then resets it to null.
   */
  pendingSelectedId = signal<number | null>(null);

  /**
   * True while a newly created contact should be scrolled to.
   * Set to true in selectContact(), reset to false in ContactList after scrolling.
   */
  scrollToContact = signal<boolean>(false);

  closeTimeout?: ReturnType<typeof setTimeout>;

  /** Opens the dialog. Pass a contact to edit it, or null to create a new one. */
  openDialog<T>(type: DialogContentType, item: T | null = null): void {
    if (this.closeTimeout) {
      clearTimeout(this.closeTimeout);
    }
    this.dialogType.set(type);
    this.selectedItem.set(item);
    this.isOpen.set(true);
  }

  /** Closes the dialog and clears the selected contact. */
  closeDialog(): void {
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
  selectContact(id: number): void {
    this.pendingSelectedId.set(id);
    this.scrollToContact.set(true);
  }
}
