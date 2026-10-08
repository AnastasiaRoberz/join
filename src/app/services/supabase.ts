import { Service, signal } from '@angular/core';
import { createClient } from '@supabase/supabase-js';
import { Contact } from '../interfaces/contact';

@Service()
export class Supabase {
  projectUrl = 'https://nnvjteipgjertrdzhhww.supabase.co';
  projectKey = 'sb_publishable_MfdCcewSWbbgiL-yF1eQnQ_CQoS8Cqs';

  supabase = createClient(this.projectUrl, this.projectKey);

  contacts = signal<Contact[]>([]);
  groupedContacts = signal<Contact[]>([]);

  constructor() {
    this.getAllContacts();
    this.getGroupedContacts();
  }

  async getAllContacts() {
    let { data: contacts, error } = await this.supabase.from('contacts').select('*');
    if (contacts) this.contacts.set(contacts);
    this.setToLocalStorage();
  }

  getGroupedContacts() {
    const sortedContacts = this.contacts().sort((a, b) => a.firstname.localeCompare(b.firstname));
    const groups: { [key: string]: Contact[] } = {};

    for (const contact of sortedContacts) {
      const firstLetter = contact.firstname.charAt(0).toUpperCase();
      if (!groups[firstLetter]) groups[firstLetter] = [];
      groups[firstLetter].push(contact);
    }

    return Object.keys(groups).map((letter) => ({
      letter,
      contacts: groups[letter],
    }));
  }

  getInitials(contact: Contact): string {
    return contact.firstname.charAt(0) + contact.surname.charAt(0);
  }

  setToLocalStorage(): void {
    localStorage.setItem('contactList', JSON.stringify(this.contacts));
  }

  getFromLocalStorage(): void {
    const storageItem = localStorage.getItem('contactList');
    if (storageItem) {
      const cachedContacts: Contact[] = JSON.parse(storageItem);
      this.contacts.set(cachedContacts);
    }
  }
}
