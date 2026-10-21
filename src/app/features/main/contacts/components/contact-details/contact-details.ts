import { Component, computed, inject, input, output, signal } from '@angular/core';
import { SupabaseService } from '../../../../../services/supabase';
import { UserAvatar } from '../../../../../shared/user-avatar/user-avatar';
import { DialogService } from '../../../../../services/dialog';
import { ConfirmService } from '../../../../../services/confirm.service';

/**
 * Shows the details of one contact (avatar, name, email, phone).
 *
 * Receives only the id of the selected contact from the Contacts container
 * and looks up the full contact itself in the Supabase service.
 *
 * @example
 * <app-contact-details [selectedId]="id" />
 */
@Component({
  imports: [UserAvatar],
  selector: 'app-contact-details',
  styleUrl: './contact-details.scss',
  templateUrl: './contact-details.html',
  host: {
    // Any click anywhere on the page closes the mobile menu (listener)
    '(document:click)': 'closeMenu()',
  },
})
export class ContactDetails {
  supabase = inject(SupabaseService);
  dialogService = inject(DialogService);
  confirmService = inject(ConfirmService);

  /** Whether the mobile Edit/Delete menu is open. */
  menuOpen = signal(false);

  /**
   * Id of the contact to display, passed in by the Contacts container.
   * Required: the component is only rendered once a contact is selected.
   */
  selectedId = input.required<number>();

  /** Emits after the contact was deleted, so the container can close the details. */
  contactDeleted = output<void>();

  /**
   * Asks the user for confirmation, then deletes the given contact and notifies
   * the container, which returns to the contact list. Does nothing on cancel.
   *
   * @param id - Id of the contact to delete.
   */
  async deleteContact(id: number | undefined): Promise<void> {
    const contact = this.selectedContact();
    if (!contact) return;

    const name = `${contact.firstname} ${contact.surname}`;
    if (!(await this.confirmService.askDelete('contact', name))) return;

    await this.supabase.deleteContact(id);
    this.contactDeleted.emit();
  }

  /**
   * The full contact object that matches `selectedId`,
   * or `undefined` if no contact with that id exists.
   * Recalculates automatically when the selected id or the
   * contact list in the service changes.
   */
  selectedContact = computed(() => {
    return this.supabase.contacts().find((item) => item.id === this.selectedId());
  });

  /**
   * Opens or closes the mobile menu.
   * stopPropagation keeps this click from reaching the listener (see above),
   * which would close the menu again right away.
   */
  toggleMenu(event: Event): void {
    event.stopPropagation();
    this.menuOpen.update((open) => !open);
  }

  /** Closes the mobile menu. */
  closeMenu(): void {
    this.menuOpen.set(false);
  }
}