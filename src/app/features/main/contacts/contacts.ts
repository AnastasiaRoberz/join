import { Component, signal } from '@angular/core';
import { ContactList } from './components/contact-list/contact-list';
import { ContactDetails } from './components/contact-details/contact-details';
import { DialogService } from '../../../services/dialog';

/**
 * Container component for the Contacts page.
 *
 * Arranges the contact list (left) and the contact details (right)
 * and owns the shared state between them: which contact is selected.
 * The list reports clicks up via an output, this component stores the id,
 * and passes it down to the list (for highlighting) and the details
 * (to load and display the contact).
 */
@Component({
  imports: [ContactList, ContactDetails],
  selector: 'app-contacts',
  styleUrl: './contacts.scss',
  templateUrl: './contacts.html',
})
export class Contacts {
  dialogService = inject(DialogService);
  
  /**
   * Id of the contact currently selected in the list.
   * `null` means no contact is selected, so the details pane stays empty
   * and on mobile the list is shown.
   */
  selectedId = signal<number | null>(null);

  /**
   * Selects a contact and opens its details.
   * Called by the list via `(contactSelected)` when a contact is clicked.
   *
   * @param id - Id of the clicked contact.
   */
  selectContact(id: number): void {
    this.selectedId.set(id);
  }

  /**
   * Clears the selection and closes the details.
   * Used by the back arrow on mobile and after a contact is deleted,
   * so the list is shown again.
   */
  closeDetails(): void {
    this.selectedId.set(null);
  }
}
