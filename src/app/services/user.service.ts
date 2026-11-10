import { computed, inject, Service, signal } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { ContactService } from './contact.service';
import { Router } from '@angular/router';
import { NameParts, splitName } from '../utils/name-utils';
import { Session, User } from '@supabase/supabase-js';
import { IntroService } from './intro.service';
import { ContactInterface } from '../interfaces/contact.interface';

/** Payload of `supabase.auth.signUp` (credentials plus profile metadata). */
export interface UserInterface {
  email: string;
  password: string;
  phone: string;
  options: {
    data: {
      first_name: string;
      full_name: string;
    };
  };
}

/** Data of the register form. */
interface SignUpData {
  name: string;
  mail: string;
  password: string;
}

/**
 * Manages the logged-in user: sign up, log in (mail or guest), log out and deleting users,
 * together with the matching contact. Holds the current user, session and contact as signals.
 */
@Service()
export class UserService {
  private readonly supabaseService = inject(SupabaseService);
  private readonly supabase = this.supabaseService.supabase;
  private readonly contactService = inject(ContactService);
  private readonly router = inject(Router);
  private readonly introService = inject(IntroService);

  /** The logged-in Supabase auth user, `null` if nobody is logged in. */
  public readonly currentUser = signal<User | null>(null);

  /** The session of the logged-in user, `null` if nobody is logged in. */
  public readonly currentSession = signal<Session | null>(null);

  /** The contact that belongs to the logged-in user (matched via `user_uid`). */
  public readonly currentContact = computed<ContactInterface | undefined>(() => {
    return this.contactService.contacts().find((item) => item.user_uid === this.currentUser()?.id);
  });

  /** All contacts sorted by name, with the contact of the logged-in user on top. */
  public readonly assignableContacts = computed<ContactInterface[]>(() => {
    const sorted = this.contactService.sortedContacts();
    const currentContactId = this.currentContact()?.id;
    if (!currentContactId) return sorted;
    const userContact = sorted.find((c) => c.id === currentContactId);
    if (!userContact) return sorted;
    return [userContact, ...sorted.filter((c) => c.id !== currentContactId)];
  });

  /**
   * Registers a new user, creates the matching contact, logs the user in and redirects to the summary.
   *
   * @param data - Name, mail and password from the register form
   * @returns A promise resolving to `true` if the user was created, otherwise `false`
   */
  public async userSignUp(data: SignUpData): Promise<boolean> {
    const nameParts = splitName(data.name);
    const newUser = await this.supabaseService.userSignUp(this.buildSignUpPayload(data, nameParts));
    if (!newUser) return false;

    await this.contactService.addContact(this.buildContact(data.mail, nameParts, newUser.user?.id));
    this.setSession(newUser.user, newUser.session);
    this.redirectToSummary();
    this.contactService.getAllContacts();
    return true;
  }

  /**
   * Logs in with mail and password, or as guest if no data is given, loads the contacts
   * and redirects to the summary.
   *
   * @param userData - Mail and password, omit for a guest login
   * @returns A promise resolving to `true` if the login succeeded, otherwise `false`
   */
  public async logIn(userData?: { mail: string; password: string }): Promise<boolean> {
    const data = userData
      ? await this.supabaseService.signInWithEmail(userData)
      : await this.supabaseService.anonymSignIn();
    if (!data) return false;

    this.setSession(data.user, data.session);
    await this.contactService.getAllContacts();
    this.redirectToSummary();
    return true;
  }

  /**
   * Logs out, redirects to the login page and clears user, session and contacts.
   *
   * @returns A promise that resolves when the logout is done (nothing changes if it fails)
   */
  public async logOut(): Promise<void> {
    const { error } = await this.supabase.auth.signOut();
    if (!error) {
      this.router.navigate(['/login']);
      this.currentUser.set(null);
      this.currentSession.set(null);
      this.contactService.contacts.set([]);
    }
  }

  /**
   * Updates user credentials / metadata in auth and syncs with the contact record.
   *
   * @param uid - ID of the auth user
   * @param userData - Partial user updates (e.g. `email`, `user_metadata`)
   */
  public async updateUser(uid: string, userData: Partial<User>): Promise<void> {
    const updatedUser = await this.supabaseService.updateUser(uid, userData);
    if (!updatedUser) return;
    this.currentUser.set(updatedUser);
    await this.syncUpdatedContact(uid, updatedUser);
  }

  /**
   * Deletes a contact and, if it belongs to a registered user, the auth user as well.
   * If the deleted user is the logged-in user, the user is logged out.
   *
   * @param id - Id of the contact
   * @param uid - Id of the linked auth user, if any
   * @returns A promise that resolves when everything is deleted
   */
  public async deleteUser(id: number, uid?: string | null): Promise<void> {
    const contactDeleted = await this.contactService.deleteContact(id);
    if (!contactDeleted) return;

    if (uid) {
      const isSelf = this.currentUser()?.id === uid;
      const success = await this.supabaseService.deleteUser(uid);

      if (success && isSelf) {
        await this.logOut();
      }
    }
  }

  /** Synchronizes auth profile updates back to the matching contact entity. */
  private async syncUpdatedContact(uid: string, user: User): Promise<void> {
    const contact = this.contactService.contacts().find((c) => c.user_uid === uid);
    if (!contact) return;
    const meta = user.user_metadata ?? {};
    await this.contactService.updateContact(contact.id, {
      mail: user.email ?? contact.mail,
      firstname: meta['first_name'] ?? contact.firstname,
      surname: meta['full_name'] ?? contact.surname,
    });
  }

  /**
   * Builds the payload for `supabase.auth.signUp`. The phone number is a placeholder.
   *
   * @param data - Data of the register form
   * @param nameParts - The split name
   */
  private buildSignUpPayload(data: SignUpData, nameParts: NameParts): UserInterface {
    return {
      email: data.mail,
      password: data.password,
      phone: '000000',
      options: {
        data: {
          first_name: nameParts.firstname,
          full_name: nameParts.surname,
        },
      },
    };
  }

  /**
   * Builds the contact that is created together with a new user.
   *
   * @param mail - Mail address of the user
   * @param nameParts - The split name
   * @param userUid - Id of the new auth user
   */
  private buildContact(
    mail: string,
    nameParts: NameParts,
    userUid?: string,
  ): Omit<ContactInterface, 'id' | 'badge_color'> {
    return { ...nameParts, mail, phone: '000000', user_uid: userUid };
  }

  /**
   * Stores user and session of a successful sign up or log in.
   *
   * @param user - The auth user
   * @param session - The session of the user
   */
  private setSession(user: User | null, session: Session | null): void {
    this.currentUser.set(user);
    this.currentSession.set(session);
  }

  /** Requests the greeting animation and navigates to the summary page. */
  private redirectToSummary(): void {
    this.introService.requestGreeting(); // greeting right before the redirect
    this.router.navigate(['app/summary']);
  }
}
