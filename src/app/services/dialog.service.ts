import { Service, signal } from '@angular/core';
import { ContactInterface } from '../interfaces/contact.interface';

@Service()
export class DialogService {
  isOpen = signal<boolean>(false);
  selectedContact = signal<ContactInterface | null>(null);

  openDialog(contact: ContactInterface | null): void {
    this.selectedContact.set(contact);
    this.isOpen.set(true);
  }

  closeDialog(): void {
    this.selectedContact.set(null);
    this.isOpen.set(false);
  }
}
