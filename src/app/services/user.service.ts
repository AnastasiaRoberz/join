import { computed, inject, Service, signal } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { ContactService } from './contact.service';
import { Router } from '@angular/router';
import { NameParts, splitName } from '../utils/name-utils';
import { Session, User, UserAttributes } from '@supabase/supabase-js';
import { IntroService } from './intro.service';
import { ContactInterface } from '../interfaces/contact.interface';
import { TaskService } from './task.service';
import { ConfirmService } from './confirm.service';
import { DraftService } from './draft.service';

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
  /** Supabase service used for database interaction. */
  private readonly supabaseService = inject(SupabaseService);
  /** Raw Supabase client instance for authentication actions. */
  private readonly supabase = this.supabaseService.supabase;
  /** Contact service for managing associated user contact entries. */
  private readonly contactService = inject(ContactService);
  /** Angular Router for redirecting users upon authentication events. */
  private readonly router = inject(Router);
  /** Intro service managing the welcome/logo splash animation. */
  private readonly introService = inject(IntroService);
  /** Task service for synchronizing task state upon session changes. */
  private readonly taskService = inject(TaskService);
  /** Draft service holding temporary form input across routes. */
  private readonly draftService = inject(DraftService);
  /** Confirm service used for interactive confirmation prompts. */
  private readonly confirmService = inject(ConfirmService);

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
   * Registers a new user, creates the matching contact, loads initial data and redirects to summary.
   *
   * @param data - Name, mail and password from the register form.
   * @returns A promise resolving to `true` if the user was created, otherwise `false`.
   */
  public async userSignUp(data: SignUpData): Promise<boolean> {
    const nameParts = splitName(data.name);
    const newUser = await this.supabaseService.userSignUp(this.buildSignUpPayload(data, nameParts));
    if (!newUser) return false;

    await this.contactService.addContact(
      this.buildContact(data.mail, nameParts, newUser.user?.id),
      false,
    );
    this.setSession(newUser.user, newUser.session);
    await this.loadInitialAppData();
    this.redirectToSummary();
    return true;
  }

  /**
   * Authenticates user with credentials or as guest, loads initial data and redirects to summary.
   *
   * @param userData - Mail and password, omit for a guest login.
   * @returns A promise resolving to `true` if the login succeeded, otherwise `false`.
   */
  public async logIn(userData?: { mail: string; password: string }): Promise<boolean> {
    const data = userData
      ? await this.supabaseService.signInWithEmail(userData)
      : await this.supabaseService.anonymSignIn();
    if (!data) return false;

    this.setSession(data.user, data.session);
    await this.loadInitialAppData();
    this.redirectToSummary();
    return true;
  }

  /**
   * Logs out, redirects to the login page and clears user, session, contacts, and drafts.
   * If entries exist in the Add Task form draft, prompts for confirmation before discarding.
   *
   * @returns A promise that resolves when the logout is done (nothing changes if cancelled or fails).
   */
  public async logOut(): Promise<void> {
    if (this.draftService.hasAddTaskDraft()) {
      const confirmed = await this.confirmService.askLogoutWithUnsavedTask();
      if (!confirmed) {
        return;
      }
      this.draftService.clearAddTaskDraft();
    }

    const user = this.currentUser();
    await this.supabaseService.cleanupAnonymousUser(user);
    const { error } = await this.supabase.auth.signOut();
    if (!error) {
      this.draftService.clearAllDrafts();
      this.router.navigate(['/login']);
      this.currentUser.set(null);
      this.currentSession.set(null);
      this.contactService.contacts.set([]);
      this.taskService.tasks.set([]);
      this.taskService.clearBoardFilter();
    }
  }

  /**
   * Restores active Supabase session and ensures cached contacts and tasks are loaded.
   *
   * @returns A promise resolving to `true` if an active session exists, otherwise `false`.
   */
  public async restoreSession(): Promise<boolean> {
    const { data } = await this.supabase.auth.getSession();
    if (!data.session) return false;

    if (!this.currentUser()) {
      this.setSession(data.session.user, data.session);
    }
    await this.ensureDataLoaded();
    return true;
  }

  /**
   * Updates credentials / metadata of the currently logged-in auth user.
   *
   * @param uid - ID of the auth user
   * @param attributes - User attributes (`email`, `data` for metadata)
   */
  public async updateUser(uid: string, attributes: UserAttributes): Promise<void> {
    if (this.currentUser()?.id !== uid) return;
    const updatedUser = await this.supabaseService.updateUser(attributes);
    if (!updatedUser) return;
    this.currentUser.set(updatedUser);
  }

  /**
   * Deletes a contact and, if it belongs to a registered user, the auth user as well.
   * If the deleted user is the logged-in user, navigate to login-page
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
        this.router.navigate(['/login']);
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
   * Fetches initial application data (contacts and tasks) concurrently.
   *
   * @returns A promise resolving when both queries have completed.
   */
  private async loadInitialAppData(): Promise<void> {
    await Promise.all([this.contactService.getAllContacts(), this.taskService.getAllTasks()]);
  }

  /**
   * Ensures contacts and tasks are populated if the respective signals are empty.
   *
   * @returns A promise resolving when pending data fetches have finished.
   */
  private async ensureDataLoaded(): Promise<void> {
    const pending: Promise<void>[] = [];
    if (this.contactService.contacts().length === 0) {
      pending.push(this.contactService.getAllContacts());
    }
    if (this.taskService.tasks().length === 0) {
      pending.push(this.taskService.getAllTasks());
    }
    if (pending.length > 0) {
      await Promise.all(pending);
    }
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
