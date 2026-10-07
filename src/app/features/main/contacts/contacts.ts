import { Component, inject } from '@angular/core';
import { Supabase } from '../../../services/supabase';

@Component({
  imports: [],
  selector: 'app-contacts',
  styleUrl: './contacts.scss',
  templateUrl: './contacts.html',
})
export class Contacts {
  supabase = inject(Supabase);
}
