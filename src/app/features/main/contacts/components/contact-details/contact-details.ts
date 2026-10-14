import { Component, computed, inject, input } from '@angular/core';
import { SupabaseService } from '../../../../../services/supabase';
import { UserAvatar } from '../../../../../shared/user-avatar/user-avatar';
import { DialogService } from '../../../../../services/dialog';

/**
 * Shows the details of one contact (avatar, name, email, phone).
 *
 * Receives only the id of the selected contact from the Contacts container
 * and looks up the full contact itself in the Supabase service.
 *
 * @example
 * <app-contact-details [selectedId]="id" />
 */
@Component({
  imports: [UserAvatar],
  selector: 'app-contact-details',
  styleUrl: './contact-details.scss',
  templateUrl: './contact-details.html',
})
export class ContactDetails {
  supabase = inject(SupabaseService);
  dialogService = inject(DialogService);

  /**
   * Id of the contact to display, passed in by the Contacts container.
   * Required: the component is only rendered once a contact is selected.
   */
  selectedId = input.required<number>();

  /**
   * The full contact object that matches `selectedId`,
   * or `undefined` if no contact with that id exists.
   * Recalculates automatically when the selected id or the
   * contact list in the service changes.
   */
  selectedContact = computed(() => {
    return this.supabase.contacts().find((item) => item.id === this.selectedId());
  });
}
