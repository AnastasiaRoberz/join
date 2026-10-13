import { computed, Service, signal } from '@angular/core';
import { createClient } from '@supabase/supabase-js';
import { Contact } from '../interfaces/contact';
import { getRandomColor } from '../utils/utils';

@Service()
export class SupabaseService {
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

  async updateContact(contactId: number | null, contactInfos: Contact) {
    const { error } = await this.supabase
      .from('contacts')
      .update({
        firstname: contactInfos.firstname,
        surname: contactInfos.surname,
        mail: contactInfos.mail,
        phone: contactInfos.phone,
      })
      .eq('id', contactId);
    console.log(error);
  }

  async addContact(contactInfos: Contact) {
    const contact: Contact = {
      firstname: contactInfos.firstname,
      surname: contactInfos.surname,
      mail: contactInfos.mail,
      phone: contactInfos.phone ?? '',
      badge_color: getRandomColor(),
    };
    const { error } = await this.supabase.from('contacts').insert(contact);
    console.log(error);
  }

  async deleteContact(contactId?: number) {
    if (!contactId) return; // real check: no id, so nothing happens

    const { error } = await this.supabase.from('contacts').delete().eq('id', contactId); // only the row with this id
    console.error(error);
    await this.getAllContacts(); // service updates its own list
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
