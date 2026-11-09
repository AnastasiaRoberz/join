import { computed, inject, Service, signal } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { ContactService } from './contact.service';
import { Router } from '@angular/router';
import { splitName } from '../utils/name-utils';
import { Session, User } from '@supabase/supabase-js';
import { IntroService } from './intro.service';

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

@Service()
export class UserService {
  supabaseService = inject(SupabaseService);
  supabase = this.supabaseService.supabase;
  contactService = inject(ContactService);
  router = inject(Router);
  introService = inject(IntroService); // NEW, next to router = inject(Router)

  currentUser = signal<User | null>(null);
  currentSession = signal<Session | null>(null);
  currentContact = computed(() => {
    return this.contactService.contacts().find((item) => item.user_uid === this.currentUser()?.id);
  });
  assignableContacts = computed(() => {
    const sorted = this.contactService.sortedContacts();
    const currentContactId = this.currentContact()?.id;
    if (!currentContactId) return sorted;
    const userContact = sorted.find((c) => c.id === currentContactId);
    if (!userContact) return sorted;
    return [userContact, ...sorted.filter((c) => c.id !== currentContactId)];
  });

  async userSignUp(data: { name: string; mail: string; password: string }): Promise<boolean> {
    const { title, firstname, surname } = splitName(data.name);
    const phone = '---';

    const userData: UserInterface = {
      email: data.mail,
      password: data.password,
      phone: phone,
      options: {
        data: {
          first_name: firstname,
          full_name: surname,
        },
      },
    };

    const newUser = await this.supabaseService.userSignUp(userData);
    if (!newUser) return false;

    const contactData = {
      title: title,
      firstname: firstname,
      surname: surname,
      mail: data.mail,
      phone: phone,
      user_uid: newUser.user?.id,
    };
    const newContact = await this.contactService.addContact(contactData);
    this.currentUser.set(newUser.user);
    this.currentSession.set(newUser.session);
    this.introService.requestGreeting(); // greeting right before the redirect
    this.router.navigate(['app/summary']);
    this.contactService.getAllContacts();
    return true;
  }

  async logIn(userData?: { mail: string; password: string }): Promise<boolean> {
    let data;
    if (userData) {
      data = await this.supabaseService.signInWithEmail(userData);
      if (!data) return false;
    } else {
      data = await this.supabaseService.anonymSignIn();
      if (!data) return false;
    }
    this.currentUser.set(data.user);
    this.currentSession.set(data.session);
    await this.contactService.getAllContacts();
    this.introService.requestGreeting(); // // greeting right before the redirect
    this.router.navigate(['app/summary']);
    return true;
  }

  async updateUser(uid: string, userData: Partial<User>) {
    const updatedUser = await this.supabaseService.updateUser(uid, userData);
    if (updatedUser) {
      const currentContact = this.contactService.contacts().find((item) => item.user_uid === uid);
      if (currentContact) {
        const newData = {
          ...currentContact,
          userData,
        };
        await this.contactService.updateContact(currentContact.id, newData);
      }
    }
  }

  async logOut() {
    const { error } = await this.supabase.auth.signOut();
    if (!error) {
      this.router.navigate(['/login']);
      this.currentUser.set(null);
      this.currentSession.set(null);
      this.contactService.contacts.set([]);
    }
  }

  async deleteUser(id: number, uid?: string | null): Promise<void> {
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
}
