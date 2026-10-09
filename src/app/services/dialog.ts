import { Service, signal } from '@angular/core';
import { Contact } from '../interfaces/contact';

@Service()
export class DialogService {
  isOpen = signal<boolean>(false);
  selectedContact = signal<Contact | null>(null);

  openDialog(contact: Contact | null): void {
    this.selectedContact.set(contact);
    this.isOpen.set(true);
  }

  closeDialog(): void {
    this.selectedContact.set(null);
    this.isOpen.set(false);
  }
}
