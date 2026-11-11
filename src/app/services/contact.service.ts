import { computed, inject, Service, signal } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { ContactInterface } from '../interfaces/contact.interface';
import { capitalizeFirstLetter, getRandomColor } from '../utils/utils';

/**
 * Domain service managing contact data, reactive state storage, alphabetical sorting,
 * grouping by initial letter, and contact mutations.
 * Serves as the single source of truth for all contacts across the application.
 */
@Service()
export class ContactService {
  /** Low-level database gateway used for contact queries and mutations. */
  private readonly supabaseService = inject(SupabaseService);

  /**
   * Reactive list of all contacts fetched from Supabase.
   * Updated in place upon addition, update, or deletion of contacts.
   */
  public readonly contacts = signal<ContactInterface[]>([]);

  /** Scroll position (px) of the contact list, kept so it can be restored after returning to the list. */
  public savedScrollTop: number = 0;

  /**
   * Derived computed signal containing all contacts sorted alphabetically by `firstname`
   * (locale-aware, via `localeCompare`).
   *
   * @remarks
   * - Creates a defensive shallow copy (`[...this.contacts()]`) before sorting to avoid mutating state
   * - Automatically recalculates whenever the underlying `contacts` signal emits a new value
   *
   * @returns An array of contacts sorted alphabetically by first name
   */
  public readonly sortedContacts = computed<ContactInterface[]>(() => {
    return [...this.contacts()].sort((a, b) => a.firstname.localeCompare(b.firstname));
  });

  /**
   * Derived computed signal that groups contacts alphabetically by the uppercase first letter of their `firstname`.
   *
   * @remarks
   * Relies on {@link ContactService.sortedContacts}, so the contacts inside each letter group
   * remain in alphabetical order. Used by the contact list view to render letter header sections.
   *
   * @returns An array of objects each containing an uppercase `letter` and its matching `contacts` array
   */
  public readonly groupedContacts = computed<{ letter: string; contacts: ContactInterface[] }[]>(
    () => this.groupContactsByLetter(this.sortedContacts()),
  );

  /**
   * Extraction function passed to `<app-select-field [getSearchStrings]>`
   * so contacts can be filtered by either first name or surname.
   *
   * @param contact - The contact item to extract searchable strings from.
   * @returns An array containing the contact's first name and surname.
   */
  public readonly contactSearchStrings = (contact: ContactInterface): string[] => [
    contact.firstname,
    contact.surname,
  ];

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
  public async getAllContacts(): Promise<void> {
    const contactData = await this.supabaseService.getData('contacts');
    if (contactData) this.contacts.set(contactData);
  }

  /**
   * Creates a new contact entry in the database with an auto-assigned badge color.
   * Appends the created record to the local `contacts` signal on success to eliminate full re-fetches.
   *
   * @param contactData - The contact information excluding server-managed properties (`id`, `badge_color`)
   * @param showFeedback - Whether to show success toast notification. Defaults to `true`.
   * @returns A promise that resolves to the newly created contact with server-generated ID, or `null` on failure
   */
  public async addContact(
    contactData: Omit<ContactInterface, 'id' | 'badge_color'>,
    showFeedback: boolean = true,
  ): Promise<ContactInterface | null> {
    const contact = {
      ...contactData,
      firstname: capitalizeFirstLetter(contactData.firstname),
      surname: capitalizeFirstLetter(contactData.surname),
      badge_color: getRandomColor(),
    };

    const newContact = await this.supabaseService.addData(contact, 'contacts', showFeedback);
    if (!newContact) return null;

    this.contacts.update((list) => [...list, newContact]);
    return newContact;
  }

  /**
   * Updates selected fields of an existing contact in the database and synchronizes the local signal.
   *
   * @param id - The ID of the contact to update
   * @param contactData - A partial object containing the properties to update
   * @returns A promise resolving after the update has been reflected in state
   */
  public async updateContact(id: number, contactData: Partial<ContactInterface>): Promise<void> {
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
   * @returns A promise that resolves to `true` when the contact has been removed from DB and state, or `false` on failure
   */
  public async deleteContact(id: number): Promise<boolean> {
    const success = await this.supabaseService.deleteData(id, 'contacts');
    if (success) {
      this.contacts.update((list) => list.filter((contact) => contact.id !== id));
      return true;
    } else {
      return false;
    }
  }

  /**
   * Groups already sorted contacts by the uppercase first letter of their `firstname`.
   *
   * @param sortedContacts - Contacts sorted by first name.
   * @returns One entry per letter, in the order the letters first appear.
   */
  private groupContactsByLetter(
    sortedContacts: ContactInterface[],
  ): { letter: string; contacts: ContactInterface[] }[] {
    const groups: { [key: string]: ContactInterface[] } = {};

    for (const contact of sortedContacts) {
      const firstLetter = contact.firstname.charAt(0).toUpperCase();
      if (!groups[firstLetter]) groups[firstLetter] = [];
      groups[firstLetter].push(contact);
    }

    return Object.keys(groups).map((letter) => ({ letter, contacts: groups[letter] }));
  }
}
