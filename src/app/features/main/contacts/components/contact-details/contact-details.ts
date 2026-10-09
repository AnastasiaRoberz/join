import { Component, computed, inject, signal } from '@angular/core';
import { SupabaseService } from '../../../../../services/supabase';
import { UserAvatar } from '../../../../../shared/user-avatar/user-avatar';
import { DialogService } from '../../../../../services/dialog';

@Component({
  imports: [UserAvatar],
  selector: 'app-contact-details',
  styleUrl: './contact-details.scss',
  templateUrl: './contact-details.html',
})
export class ContactDetails {
  supabase = inject(SupabaseService);
  dialogService = inject(DialogService);
  selectedId = signal<number | null>(4);

  selectedContact = computed(() => {
    return this.supabase.contacts().find((item) => item.id === this.selectedId());
  });
}
