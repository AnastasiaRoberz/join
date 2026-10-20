import { Service, signal } from '@angular/core';
import { ContactInterface } from '../interfaces/contact.interface';

@Service()
export class DialogService {
  isOpen = signal<boolean>(false);
  selectedContact = signal<ContactInterface | null>(null);
  pendingSelectedId = signal<number | null>(null); //User-Id from new added contact, used for method selectContact

  openDialog(contact: ContactInterface | null): void {
    this.selectedContact.set(contact);
    this.isOpen.set(true);
  }

  closeDialog(): void {
    this.selectedContact.set(null);
    this.isOpen.set(false);
  }

  //no return (:void); dialog calls selected Contact with id (e.g. selectContact(42))
  //--> selectecId as a signal gets this id and passes it on to contacts.ts: constructor
  selectContact(id: number): void {
    this.pendingSelectedId.set(id);
  }
}
