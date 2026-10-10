import { Component, signal } from '@angular/core';
import { ContactList } from './components/contact-list/contact-list';
import { ContactDetails } from './components/contact-details/contact-details';

@Component({
  imports: [ContactList, ContactDetails],
  selector: 'app-contacts',
  styleUrl: './contacts.scss',
  templateUrl: './contacts.html',
})
export class Contacts {
  /** Id of the contact clicked in the list; null = nothing selected. */
  selectedId = signal<number | null>(null);

  /** Called by the list when a contact is clicked. */
  selectContact(id: number): void {
    this.selectedId.set(id);
  }

  /** Back arrow on mobile, or after a delete: shows the list again. */
  closeDetails(): void {
    this.selectedId.set(null);
  }
}
