import { inject, Service, signal } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { ContactService } from './contact.service';
import { Router } from '@angular/router';
import { splitName } from '../utils/name-utils';
import { User } from '@supabase/supabase-js';

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

  currentUser = signal<User | null>(null);

  async userSignUp(data: { name: string; mail: string; password: string }): Promise<void> {
    const { title, firstname, surname } = splitName(data.name);
    const phone = '000000';

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

    if (newUser) {
      const contactData = {
        title: title,
        firstname: firstname,
        surname: surname,
        mail: data.mail,
        phone: phone,
        uid: newUser.user?.id,
      };
      const newContact = await this.contactService.addContact(contactData);
      this.router.navigate(['/summary']);
    }
  }

  async logIn(userData: { mail: string; password: string }) {
    const user = await this.supabaseService.signInWithEmail(userData);

    if (user) {
      this.router.navigate(['/summary']);
      this.currentUser.set(user);
    }
  }

  async updateUser(uid: string, userData: Partial<User>) {
    const updatedUser = await this.supabaseService.updateUser(uid, userData);
    if (updatedUser) {
      const currentContact = this.contactService.contacts().find((item) => item.uid === uid);
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
    if (!error) this.router.navigate(['/login']);
  }

  async deleteUser(uid: string) {
    const contact = this.contactService.contacts().find((item) => item.uid === uid);
    if (contact) {
      const success = await this.supabaseService.deleteUser(uid);
      if (success) await this.contactService.deleteContact(contact.id);
    }
  }
}
