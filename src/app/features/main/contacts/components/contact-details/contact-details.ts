import { Component, computed, inject, input } from '@angular/core';
import { Supabase } from '../../../../../services/supabase';
import { UserAvatar } from '../../../../../shared/user-avatar/user-avatar';

@Component({
  imports: [UserAvatar],
  selector: 'app-contact-details',
  styleUrl: './contact-details.scss',
  templateUrl: './contact-details.html',
})
export class ContactDetails {
  supabase = inject(Supabase);
  selectedId = input.required<number>(); // id from contacts

  selectedContact = computed(() => {
    return this.supabase.contacts().find((item) => item.id === this.selectedId());
  });
  // finds contact with received id
}
