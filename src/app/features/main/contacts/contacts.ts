import { Component, effect, ElementRef, inject, signal, viewChild } from '@angular/core';
import { ContactList } from './components/contact-list/contact-list';
import { ContactDetails } from './components/contact-details/contact-details';
import { DialogService } from '../../../services/dialog.service';
import { ResponsiveService } from '../../../services/responsive.service';
import { Buttons } from '../../../shared/button.component/button.component';
import { ContactService } from '../../../services/contact.service';

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
  imports: [ContactList, ContactDetails, Buttons],
  selector: 'app-contacts',
  styleUrl: './contacts.scss',
  templateUrl: './contacts.html',
})
export class Contacts {
  /** Responsive service used for layout adjustments. */
  protected readonly responsiveService = inject(ResponsiveService);

  /** Dialog service providing pending selected contact IDs after create/edit. */
  protected readonly dialogService = inject(DialogService);

  /** Contact service managing saved scroll position and contacts state. */
  protected readonly contactService = inject(ContactService);

  /** Signal indicating viewports with height <= 500px. */
  protected readonly shortHeight = this.responsiveService.isMaxHeight(500);

  /**
   * Id of the contact currently selected in the list.
   * `null` means no contact is selected, so the details pane stays empty
   * and on mobile the list is shown.
   */
  public readonly selectedId = signal<number | undefined | null>(null);

  /**
   * The rendered details component, read as its DOM element so it can be animated.
   * `undefined` while no contact is selected.
   */
  private readonly contactDetails = viewChild(ContactDetails, { read: ElementRef });

  constructor() {
    this.initPendingSelectionEffect();
    this.initSlideInEffect();
  }

  /**
   * Selects a contact and opens its details.
   * Called by the list via `(contactSelected)` when a contact is clicked.
   *
   * @param id - Id of the clicked contact.
   */
  protected selectContact(id: number | undefined): void {
    this.selectedId.set(id);
  }

  /**
   * Clears the selection and closes the details.
   * Used by the back arrow on mobile and after a contact is deleted,
   * so the list is shown again.
   */
  protected closeDetails(): void {
    this.selectedId.set(null);
  }

  /**
   * Clears saved scroll position and deselects contact upon deletion.
   */
  protected onContactDeleted(): void {
    this.contactService.savedScrollTop = 0;
    this.closeDetails();
  }

  /**
   * Runs slide-in animation on the given element.
   *
   * @param details - The details container element to animate.
   */
  private slideIn(details: HTMLElement): void {
    details.animate(
      [
        { left: '100%', opacity: 0 },
        { left: '0', opacity: 1 },
      ],
      { duration: 300, easing: 'ease-out' },
    );
  }

  /** Synchronizes contact selection with pending selection ID from dialogs. */
  private initPendingSelectionEffect(): void {
    effect(() => {
      const id = this.dialogService.pendingSelectedId();
      if (id !== null) {
        this.selectedId.set(id);
        this.dialogService.pendingSelectedId.set(null);
      }
    });
  }

  /** Slides in the details view whenever a new contact is selected. */
  private initSlideInEffect(): void {
    effect(() => {
      this.selectedId();
      const details = this.contactDetails()?.nativeElement as HTMLElement | undefined;
      if (details) this.slideIn(details);
    });
  }
}
