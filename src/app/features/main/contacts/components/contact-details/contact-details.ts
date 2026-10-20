import { Component, computed, inject, input, signal } from '@angular/core';
import { SupabaseService } from '../../../../../services/supabase';
import { UserAvatar } from '../../../../../shared/user-avatar/user-avatar';
import { DialogService } from '../../../../../services/dialog';

// amount of loetter as of where a name is considered long
const longNames = 10;

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

  /** Whether the mobile Edit/Delete menu is open. */
  menuOpen = signal(false);

  /**
   * Id of the contact to display, passed in by the Contacts container.
   * Required: the component is only rendered once a contact is selected.
   */
  selectedId = input.required<number>();

  /**
   * The full contact object that matches `selectedId`,
   * or `undefined` if no contact with that id exists.
   * Recalculates automatically when the selected id or the
   * contact list in the service changes.
   */
  selectedContact = computed(() => {
    return this.supabase.contacts().find((item) => item.id === this.selectedId());
  });

  // true if full name is longer than 20 characters
  isLongName = computed(() => {
    const contact = this.selectedContact();
    if (!contact) return false;
    return contact.firstname.length > longNames || contact.surname.length > longNames;
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
