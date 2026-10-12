import { Component, inject } from '@angular/core';
import { SupabaseService } from '../../../services/supabase';
import { ContactList } from './components/contact-list/contact-list';
import { ContactDetails } from './components/contact-details/contact-details';
import { DialogService } from '../../../services/dialog';
import { ContactDialog } from './components/contact-dialog/contact-dialog';

@Component({
  imports: [ContactList, ContactDetails, ContactDialog],
  selector: 'app-contacts',
  styleUrl: './contacts.scss',
  templateUrl: './contacts.html',
})
export class Contacts {
  supabase = inject(SupabaseService);
  dialogService = inject(DialogService);
}
