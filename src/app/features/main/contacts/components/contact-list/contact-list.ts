import { Component, inject, input, output } from '@angular/core';
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

  /** Id of the contact shown in the detail pane; set by the Contacts container. */
  selectedId = input<number | null>(null);

  /** Emits the id of the clicked contact. */
  contactSelected = output<number>();
}
