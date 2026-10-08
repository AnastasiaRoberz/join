import { Component, inject } from '@angular/core';
import { Supabase } from '../../../../../services/supabase';
import { UserAvatar } from '../../../../../shared/user-avatar/user-avatar';

@Component({
  imports: [UserAvatar],
  selector: 'app-contact-list',
  styleUrl: './contact-list.scss',
  templateUrl: './contact-list.html',
})
export class ContactList {
  supabase = inject(Supabase);
}
