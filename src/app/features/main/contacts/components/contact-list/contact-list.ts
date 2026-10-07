import { Component, inject } from '@angular/core';
import { Supabase } from '../../../../../services/supabase';

@Component({
  imports: [],
  selector: 'app-contact-list',
  styleUrl: './contact-list.scss',
  templateUrl: './contact-list.html',
})
export class ContactList {
  supabase = inject(Supabase);
}
