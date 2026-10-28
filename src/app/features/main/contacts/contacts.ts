import { Component, effect, ElementRef, inject, signal, viewChild } from '@angular/core';
import { ContactList } from './components/contact-list/contact-list';
import { ContactDetails } from './components/contact-details/contact-details';
import { DialogService } from '../../../services/dialog.service';
import { ContactDialog } from './components/contact-dialog/contact-dialog';
import { ResponsiveService } from '../../../services/responsive.service';
import { Buttons } from '../../../shared/button.component/button.component';

/**
 * Container component for the Contacts page.
 *
 * Arranges the contact list (left) and the contact details (right)
 * and owns the shared state between them: which contact is selected.
 * The list reports clicks up via an output, this component stores the id,
 * and passes it down to the list (for highlighting) and the details
 * (to load and display the contact).
 */
@Component({
  imports: [ContactList, ContactDetails, ContactDialog, Buttons],
  selector: 'app-contacts',
  styleUrl: './contacts.scss',
  templateUrl: './contacts.html',
  host: {
    '[class.is-mobile]': 'responsiveService.isMobile()',
    '[class.breakpoint-slogan]': 'breakpointSlogan()',
  },
})
export class Contacts {
  responsiveService = inject(ResponsiveService);
  dialogService = inject(DialogService);
  breakpointSlogan = this.responsiveService.isMaxWidth(1290);

  /**
   * Id of the contact currently selected in the list.
   * `null` means no contact is selected, so the details pane stays empty
   * and on mobile the list is shown.
   */
  selectedId = signal<number | undefined | null>(null);

  /**
   * The rendered details component, read as its DOM element so it can be animated.
   * `undefined` while no contact is selected.
   */
  contactDetails = viewChild(ContactDetails, { read: ElementRef });

  constructor() {
    effect(() => {
      const id = this.dialogService.pendingSelectedId(); //reads signal
      if (id !== null) {
        this.selectedId.set(id); //selects contact with this id
        this.dialogService.pendingSelectedId.set(null); //resets signal
      }
    });

    // Slide the details in from the right whenever they appear
    // or when a different contact is selected.
    effect(() => {
      this.selectedId();
      const details = this.contactDetails()?.nativeElement as HTMLElement | undefined; // due to undefined when not selected
      if (details) this.slideIn(details);
    });
  }

  /**
   * Selects a contact and opens its details.
   * Called by the list via `(contactSelected)` when a contact is clicked.
   *
   * @param id - Id of the clicked contact.
   */
  selectContact(id: number | undefined): void {
    this.selectedId.set(id);
  }

  /**
   * Clears the selection and closes the details.
   * Used by the back arrow on mobile and after a contact is deleted,
   * so the list is shown again.
   */
  closeDetails(): void {
    this.selectedId.set(null);
  }

  /**
   * slide-in animation on the given element.
   *
   * @param element - element to animate.
   */
  slideIn(details: HTMLElement): void {
    details.animate(
      [
        { left: '100%', opacity: 0 },
        { left: '0', opacity: 1 },
      ],
      { duration: 300, easing: 'ease-out' },
    );
  }
}
