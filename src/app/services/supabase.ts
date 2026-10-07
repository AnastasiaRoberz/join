import { Service, signal } from '@angular/core';
import { createClient } from '@supabase/supabase-js';
import { Login } from '../features/auth/login/login';

@Service()
export class Supabase {
  projectUrl = 'https://nnvjteipgjertrdzhhww.supabase.co';
  projectKey = 'sb_publishable_MfdCcewSWbbgiL-yF1eQnQ_CQoS8Cqs';

  supabase = createClient(this.projectUrl, this.projectKey);

  contacts = signal<
    {
      id: number;
      created_at: string;
      firstname: string;
      surname: string;
      mail: string;
      phone: string;
      badge_color: string;
    }[]
  >([]);

  async getAllContacts() {
    let { data: contacts, error } = await this.supabase.from('contacts').select('*');
    if (!contacts) return;
    this.contacts.set(contacts);
  }
}
