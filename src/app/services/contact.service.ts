import { computed, inject, Service, signal } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { ContactInterface } from '../interfaces/contact.interface';
import { getRandomColor } from '../utils/utils';

/**
 * Domain service managing contact data, reactive state storage, alphabetical sorting,
 * and contact mutations.
 */
@Service()
export class ContactService {
  supabaseService = inject(SupabaseService);

  contacts = signal<ContactInterface[]>([]);

  /**
   * Initializes the service and triggers the initial fetch of all contacts.
   */
  constructor() {
    this.getAllContacts();
  }

  /**
   * Fetches all contacts from the `contacts` table and writes them to the `contacts` signal.
   *
   * @returns A promise that resolves when the signal has been populated
   */
  async getAllContacts(): Promise<void> {
    const contactData = await this.supabaseService.getData('contacts');
    if (contactData) this.contacts.set(contactData);
  }

  /**
   * Fetches a single contact by ID directly from the database.
   * Useful when opening detailed route views without relying on an existing client-side cache.
   *
   * @param id - The ID of the contact to retrieve
   * @returns A promise resolving to the contact record, or `null` if not found
   */
  async getOneContact(id: number): Promise<ContactInterface | null> {
    return await this.supabaseService.getOneItem('contacts', id);
  }

  /**
   * Derived computed signal that groups contacts alphabetically by the uppercase initial of their first name.
   *
   * @remarks
   * - Creates a defensive shallow copy (`[...this.contacts()]`) before sorting to avoid mutating state
   * - Automatically recalculates whenever the underlying `contacts` signal emits a new value
   *
   * @returns An array of objects each containing an uppercase `letter` and its matching `contacts` array
   */
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

  /**
   * Creates a new contact entry in the database with an auto-assigned badge color.
   * Appends the created record to the local `contacts` signal on success to eliminate full re-fetches.
   *
   * @param contactData - The contact information excluding server-managed properties (`id`, `badge_color`)
   * @returns A promise that resolves once insertion and state update are complete
   */
  async addContact(contactData: Omit<ContactInterface, 'id' | 'badge_color'>) {
    const contact = {
      ...contactData,
      badge_color: getRandomColor(),
    };

    const newContact = await this.supabaseService.addData(contact, 'contacts');
    if (newContact) {
      this.contacts.update((list) => [...list, newContact]);
      return newContact; // Returns the full contact object including the server-generated id
    }
    return null; // Returns null if the insert failed
  }

  /**
   * Updates selected fields of an existing contact in the database and synchronizes the local signal.
   *
   * @param id - The ID of the contact to update
   * @param contactData - A partial object containing the properties to update
   * @returns A promise resolving after the update has been reflected in state
   */
  async updateContact(id: number, contactData: Partial<ContactInterface>) {
    const success = await this.supabaseService.updateData(id, contactData, 'contacts');
    if (success) {
      this.contacts.update((list) =>
        list.map((contact) => (contact.id === id ? { ...contact, ...contactData } : contact)),
      );
    }
  }

  /**
   * Removes a contact from the database by ID and filters it out of the local `contacts` signal.
   *
   * @param id - The ID of the contact to delete
   * @returns A promise that resolves when the contact has been removed from DB and state
   */
  async deleteContact(id: number): Promise<boolean> {
    const success = await this.supabaseService.deleteData(id, 'contacts');
    if (success) {
      this.contacts.update((list) => list.filter((contact) => contact.id !== id));
      return true;
    }
    return false;
  }
}
