import { computed, inject, Service, signal } from '@angular/core';
import { createClient } from '@supabase/supabase-js';
import { Contact } from '../interfaces/contact';
import { getRandomColor } from '../utils/utils';
import { FeedbackService } from './feedback-service';
import { environment } from '../../environment/environment';

@Service()
export class SupabaseService {
  projectUrl = environment.supabaseUrl;
  projectKey = environment.supabaseAnonKey;

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
      this.feedbackService.showError('Create contact failed.');
    }
  }

  async deleteContact(contactId?: number) {
    if (!contactId) return;

    const { error } = await this.supabase.from('contacts').delete().eq('id', contactId);
    await this.getAllContacts();

    if (!error) {
      this.feedbackService.showSuccess('Contact succesfully deleted.');
    } else {
      this.feedbackService.showError('Delete contact failed.');
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
