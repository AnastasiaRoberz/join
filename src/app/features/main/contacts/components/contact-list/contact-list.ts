import {
  Component,
  effect,
  ElementRef,
  inject,
  input,
  output,
  QueryList,
  ViewChildren,
} from '@angular/core';
import { UserAvatar } from '../../../../../shared/user-avatar/user-avatar';
import { DialogService } from '../../../../../services/dialog.service';
import { ContactService } from '../../../../../services/contact.service';
import { ContactInterface } from '../../../../../interfaces/contact.interface';

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

  // Collects all <button #contactBtn> elements from the template into a queryable list
  @ViewChildren('contactBtn') contactButtons!: QueryList<ElementRef>;

  constructor() {
    // Runs automatically whenever selectedId changes
    effect(() => {
      const id = this.selectedId();
      if (!id) return; // No contact selected → nothing to scroll to

      // Wait for Angular to finish rendering the DOM before scrolling
      setTimeout(() => {
        // Flatten the grouped contacts into a single array,
        // preserving the same order as the buttons appear in the DOM
        const allContacts = this.contactService
          .groupedContacts()
          .flatMap((g: { letter: string; contacts: ContactInterface[] }) => g.contacts);

        // Find the position of the selected contact in the flattened list —
        // this index matches the button's position in contactButtons
        const index = allContacts.findIndex((c) => c.id === id);

        // Get the corresponding DOM button by index and scroll it into view
        const button = this.contactButtons.toArray()[index];
        button?.nativeElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 50);
    });
  }
}
