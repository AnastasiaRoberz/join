import { Component, inject } from '@angular/core';
import { SupabaseService } from '../../../../../services/supabase';
import { UserAvatar } from '../../../../../shared/user-avatar/user-avatar';
import { DialogService } from '../../../../../services/dialog';
import { Buttons } from '../../../../../shared/buttons/buttons';

@Component({
  imports: [UserAvatar, Buttons],
  selector: 'app-contact-list',
  styleUrl: './contact-list.scss',
  templateUrl: './contact-list.html',
})
export class ContactList {
  supabase = inject(SupabaseService);
  dialogService = inject(DialogService);
}
