import { Component, inject, input, output } from '@angular/core';
import { UserAvatar } from '../../../../../shared/user-avatar/user-avatar';
import { DialogService } from '../../../../../services/dialog.service';
import { ContactService } from '../../../../../services/contact.service';

/**
 * Displays all contacts grouped by first letter and lets the user pick one.
 *
 * This is a presentational child of the Contacts container: it does not
 * decide which contact is selected. It reports clicks via `contactSelected`
 * and receives the current selection via `selectedId` to highlight it.
 *
 * @example
 * <app-contact-list
 *   [selectedId]="selectedId()"
 *   (contactSelected)="selectContact($event)" />
 */
@Component({
  imports: [UserAvatar],
  selector: 'app-contact-list',
  styleUrl: './contact-list.scss',
  templateUrl: './contact-list.html',
})
export class ContactList {
  /**
   * Shared Contact service that provides the contact data
   * (e.g. `getGroupedContacts()` used in the template).
   */
  contactService = inject(ContactService);
  dialogService = inject(DialogService);

  /**
   * Id of the contact currently shown in the detail pane.
   * Set by the Contacts container; used to add the `contact--active`
   * class (dark blue highlight) to the matching list entry.
   * `null` when no contact is selected.
   */
  selectedId = input<number | undefined | null>(null);

  /**
   * Emits the id of the contact the user clicked.
   * The Contacts container listens to this and updates its `selectedId`,
   * which then opens the contact details.
   */
  contactSelected = output<number | undefined>();
}
