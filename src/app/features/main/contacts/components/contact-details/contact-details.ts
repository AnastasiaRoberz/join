import { Component, computed, inject, signal } from '@angular/core';
import { Supabase } from '../../../../../services/supabase';

@Component({
  imports: [],
  selector: 'app-contact-details',
  styleUrl: './contact-details.scss',
  templateUrl: './contact-details.html',
})
export class ContactDetails {
  supabase = inject(Supabase);
  selectedId = signal<number>(4);

  selectedContact = computed(() => {
    return this.supabase.contacts().find((item) => item.id === this.selectedId());
  });
}
