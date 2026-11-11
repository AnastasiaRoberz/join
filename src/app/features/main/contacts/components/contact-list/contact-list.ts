import {
  AfterViewInit,
  Component,
  effect,
  ElementRef,
  inject,
  input,
  output,
  viewChild,
  viewChildren,
} from '@angular/core';
import { UserAvatar } from '../../../../../shared/user-avatar/user-avatar';
import { DialogService } from '../../../../../services/dialog.service';
import { ContactService } from '../../../../../services/contact.service';
import { Buttons } from '../../../../../shared/button.component/button.component';
import { ResponsiveService } from '../../../../../services/responsive.service';
import { fullName } from '../../../../../utils/name-utils';
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
  imports: [UserAvatar, Buttons],
  selector: 'app-contact-list',
  styleUrl: './contact-list.scss',
  templateUrl: './contact-list.html',
  host: {
    '[class.scroll-container]': 'shortHeight()',
  },
})
export class ContactList implements AfterViewInit {
  /** Contact service providing grouped contacts list and saved scroll position. */
  protected readonly contactService = inject(ContactService);

  /** Dialog service providing scroll trigger flags and open dialog controls. */
  protected readonly dialogService = inject(DialogService);

  /** Responsive service for viewport layout queries. */
  protected readonly responsiveService = inject(ResponsiveService);

  /** Signal indicating viewports with height <= 500px. */
  protected readonly shortHeight = this.responsiveService.isMaxHeight(500);

  /** Formatter function combining name parts for accessible labels. */
  protected readonly fullName = fullName;

  /**
   * Id of the contact currently shown in the detail pane.
   * Used to apply `contact-card-btn--active` highlight class.
   */
  public readonly selectedId = input<number | undefined | null>(null);

  /** Emits the id of the contact the user clicked. */
  public readonly contactSelected = output<number | undefined>();

  /** Query list of all contact card button elements. */
  private readonly contactButtons = viewChildren<ElementRef<HTMLElement>>('contactBtn');

  /** Reference to the scrollable container wrapping contact cards. */
  private readonly scrollContainer = viewChild<ElementRef<HTMLElement>>('scrollContainer');

  /** Tracks previously selected contact id to detect deletions. */
  private previousId: number | null = null;

  /** Initializes reactive effect to scroll selected contact into view when selection changes. */
  constructor() {
    this.initScrollEffect();
  }

  /** Restores previous scroll position after view initialization. */
  public ngAfterViewInit(): void {
    const scrollPos = this.contactService.savedScrollTop;
    const container = this.scrollContainer()?.nativeElement;
    if (container && scrollPos > 0) {
      container.scrollTop = scrollPos;
      requestAnimationFrame(() => {
        container.scrollTop = scrollPos;
      });
    }
  }

  /** Stores current scroll offset and emits selected contact id. */
  protected selectContact(id: number | undefined): void {
    const container = this.scrollContainer()?.nativeElement;
    if (container) {
      this.contactService.savedScrollTop = container.scrollTop;
    }
    this.contactSelected.emit(id);
  }

  /** Reacts to selection changes to center newly added contacts or scroll to top on deletion.
   * Scroll is only triggered when both `scrollToContact` and `isNewContact` are true,
   * preventing unwanted scrolling when an existing contact is edited.
   */ private initScrollEffect(): void {
    effect(() => {
      const id = this.selectedId();
      const shouldScroll = this.dialogService.scrollToContact();
      const isNew = this.dialogService.isNewContact();
      setTimeout(() => this.handleContactScroll(id, shouldScroll && isNew), 50);
    });
  }

  /** Dispatches scroll actions depending on whether contact was selected or deleted. */
  private handleContactScroll(id: number | undefined | null, shouldScroll: boolean): void {
    if (id) {
      this.previousId = id;
      if (shouldScroll) {
        this.scrollToContactById(id);
      }
    } else if (!id && this.previousId) {
      this.contactButtons()[0]?.nativeElement.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      });
      this.previousId = null;
    }
  }

  /** Centers the button element of the contact with the given id into view. */
  private scrollToContactById(id: number): void {
    const allContacts = this.contactService.groupedContacts().flatMap((g) => g.contacts);
    const index = allContacts.findIndex((c) => c.id === id);
    const button = this.contactButtons()[index];
    button?.nativeElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
    this.dialogService.scrollToContact.set(false);
  }

  /**
   * Returns the group letter as a stable tracking key.
   * Prevents Angular from rebuilding group DOM elements when contacts are renamed.
   */
  protected trackGroup(_index: number, group: { letter: string }): string {
    return group.letter;
  }

  /**
   * Returns the contact id as a stable tracking key.
   * Prevents scroll position jumps and DOM rebuilds when contact data changes.
   */
  protected trackContact(_index: number, contact: ContactInterface): number {
    return contact.id!;
  }
}
