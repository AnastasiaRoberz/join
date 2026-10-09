import { Component, inject } from '@angular/core';
import { Supabase } from '../../../services/supabase';
import { ContactList } from './components/contact-list/contact-list';
import { ContactDetails } from './components/contact-details/contact-details';

@Component({
  imports: [ContactList, ContactDetails],
  selector: 'app-contacts',
  styleUrl: './contacts.scss',
  templateUrl: './contacts.html',
})
export class Contacts {
  supabase = inject(Supabase);
}
