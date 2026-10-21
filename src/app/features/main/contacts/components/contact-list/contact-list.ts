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
import { Buttons } from '../../../../../shared/button.component/button.component';
import { ResponsiveService } from '../../../../../services/responsive.service';

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
  imports: [UserAvatar, Buttons],
  selector: 'app-contact-list',
  styleUrl: './contact-list.scss',
  templateUrl: './contact-list.html',
  host: {
    '[class.is-mobile]': 'responsiveService.isMobile()',
  },
})
export class ContactList {
  /**
   * Shared Contact service that provides the contact data
   * (e.g. `getGroupedContacts()` used in the template).
   */
  contactService = inject(ContactService);
  dialogService = inject(DialogService);
  responsiveService = inject(ResponsiveService);

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
    /**
     * Tracks the previously selected contact id.
     * Used to detect when a contact was deleted (id goes from a value to null).
     */
    let previousId: number | null = null;

    /**
     * Reacts automatically whenever selectedId or isNewContact changes.
     * - New contact created → scrolls to it in the center of the list
     * - Contact deleted (id becomes null) → scrolls back to the top
     */
    effect(() => {
      const id = this.selectedId();
      const isNewContact = this.dialogService.isNewContact();

      // Wait for Angular to finish rendering the DOM before scrolling
      setTimeout(() => {
        if (id) {
          previousId = id;

          if (isNewContact) {
            // Flatten grouped contacts into a single array in the same order as the DOM
            const allContacts = this.contactService
              .groupedContacts()
              .flatMap((g: { letter: string; contacts: ContactInterface[] }) => g.contacts);

            // Index in allContacts matches the button's index in contactButtons
            const index = allContacts.findIndex((c) => c.id === id);
            const button = this.contactButtons.toArray()[index];
            button?.nativeElement.scrollIntoView({ behavior: 'smooth', block: 'center' });

            // Reset flag after scrolling so subsequent selections don't trigger this branch
            this.dialogService.isNewContact.set(false);
          }
        } else if (!id && previousId) {
          // A contact was deleted → scroll back to the top of the list
          this.contactButtons.first?.nativeElement.scrollIntoView({
            behavior: 'smooth',
            block: 'start',
          });
          previousId = null;
        }
      }, 50);
    });
  }
}
