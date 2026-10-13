import { computed, inject, Service, signal } from '@angular/core';
import { createClient } from '@supabase/supabase-js';
import { Contact } from '../interfaces/contact';
import { getRandomColor } from '../utils/utils';
import { FeedbackService } from './feedback-service';

@Service()
export class SupabaseService {
  projectUrl = 'https://nnvjteipgjertrdzhhww.supabase.co';
  projectKey = 'sb_publishable_MfdCcewSWbbgiL-yF1eQnQ_CQoS8Cqs';

  feedbackService = inject(FeedbackService);

  supabase = createClient(this.projectUrl, this.projectKey);

  contacts = signal<Contact[]>([]);
  groupedContacts = signal<Contact[]>([]);
  successful = signal<boolean>(false);

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

    if (!error) {
      this.feedbackService.showSuccess('Contact succesfully updated.');
    } else {
      console.log('Supabase Error: ', error);
      this.feedbackService.showError('Update contact failed.');
    }
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

    if (!error) {
      this.feedbackService.showSuccess('Contact succesfully created.');
    } else {
      console.log('Supabase Error: ', error);
      this.feedbackService.showError('Create contact failed.');
    }
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
