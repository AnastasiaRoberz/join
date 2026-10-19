import { computed, inject, Service, signal } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { ContactInterface } from '../interfaces/contact.interface';
import { getRandomColor } from '../utils/utils';

@Service()
export class ContactService {
  supabaseService = inject(SupabaseService);

  contacts = signal<ContactInterface[]>([]);

  constructor() {
    this.getAllContacts();
  }

  async getAllContacts(): Promise<void> {
    const contactData = await this.supabaseService.getData('contacts');
    if (contactData) this.contacts.set(contactData);
  }

  async getOneContact(id: number): Promise<ContactInterface | null> {
    return await this.supabaseService.getOneItem('contacts', id);
  }

  groupedContacts = computed(() => {
    const sortedContacts = [...this.contacts()].sort((a, b) =>
      a.firstname.localeCompare(b.firstname),
    );

    const groups: { [key: string]: ContactInterface[] } = {};

    for (const contact of sortedContacts) {
      const firstLetter = contact.firstname.charAt(0).toUpperCase();
      if (!groups[firstLetter]) groups[firstLetter] = [];
      groups[firstLetter].push(contact);
    }

    return Object.keys(groups).map((letter) => ({
      letter,
      contacts: groups[letter],
    }));
  });

  async addContact(contactData: Omit<ContactInterface, 'id' | 'badge_color'>) {
    const contact = {
      ...contactData,
      badge_color: getRandomColor(),
    };

    const newContact = await this.supabaseService.addData(contact, 'contacts');
    if (newContact) {
      this.contacts.update((list) => [...list, newContact]);
    }
  }

  async updateContact(id: number, contactData: Partial<ContactInterface>) {
    const success = await this.supabaseService.updateData(id, contactData, 'contacts');
    if (success) {
      this.contacts.update((list) =>
        list.map((contact) => (contact.id === id ? { ...contact, ...contactData } : contact)),
      );
    }
  }

  async deleteContact(id: number) {
    const success = await this.supabaseService.deleteData(id, 'contacts');
    if (success) {
      this.contacts.update((list) => list.filter((contact) => contact.id !== id));
    }
  }
}
