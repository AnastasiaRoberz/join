import { Component, computed, inject, input, output, signal } from '@angular/core';
import { UserAvatar } from '../../../../../shared/user-avatar/user-avatar';
import { DialogService } from '../../../../../services/dialog.service';
import { ContactService } from '../../../../../services/contact.service';
import { ResponsiveService } from '../../../../../services/responsive.service';
import { Buttons } from '../../../../../shared/button.component/button.component';
import { ConfirmService } from '../../../../../services/confirm.service';
import { fullName } from '../../../../../utils/name-utils';
import { UserService } from '../../../../../services/user.service';
import { FitTextDirective } from '../../../../../directives/fit-text.directive';
import { ContactInterface } from '../../../../../interfaces/contact.interface';

/**
 * Shows the details of one contact (avatar, name, email, phone).
 *
 * Receives the id of the selected contact from the Contacts container
 * and looks up the full contact in {@link ContactService}.
 *
 * @example
 * <app-contact-details [selectedId]="id" />
 */
@Component({
  imports: [UserAvatar, Buttons, FitTextDirective],
  selector: 'app-contact-details',
  styleUrl: './contact-details.scss',
  templateUrl: './contact-details.html',
  host: {
    '(document:click)': 'closeMenu()',
    '[class.scroll-container]': 'middleHeight()',
  },
})
export class ContactDetails {
  /** Contact service providing reactive contacts signal. */
  private readonly contactService = inject(ContactService);

  /** Dialog service for opening the contact edit dialog. */
  protected readonly dialogService = inject(DialogService);

  /** Responsive service for viewport layout queries. */
  protected readonly responsiveService = inject(ResponsiveService);

  /** User service for deleting user accounts and contacts. */
  private readonly userService = inject(UserService);

  /** Confirmation prompt service for delete actions. */
  private readonly confirmService = inject(ConfirmService);

  /** Signal indicating viewports with height <= 500px. */
  protected readonly shortHeight = this.responsiveService.isMaxHeight(500);

  /** Signal indicating viewports with height between 501px and 700px. */
  protected readonly middleHeight = this.responsiveService.observeQuery(
    '(min-height: 501px) and (max-height: 700px)',
  );

  /** Emitted after a contact is successfully deleted. */
  public readonly contactDeleted = output<void>();

  /** Formatter function combining name parts for display. */
  protected readonly fullName = fullName;

  /** Whether the mobile Edit/Delete menu is open. */
  protected readonly menuOpen = signal<boolean>(false);

  /** Id of the contact to display, passed in by the Contacts container. */
  public readonly selectedId = input.required<number>();

  /** Full contact object matching `selectedId`, or `undefined` if none matches. */
  protected readonly selectedContact = computed<ContactInterface | undefined>(() =>
    this.contactService.contacts().find((item) => item.id === this.selectedId()),
  );

  /**
   * Asks the user for confirmation, then deletes the given contact and notifies the container.
   *
   * @param contact - The contact to delete.
   */
  protected async deleteContact(contact: ContactInterface): Promise<void> {
    if (!(await this.confirmService.askDelete('Contact'))) return;

    await this.userService.deleteUser(contact.id, contact?.user_uid);
    this.contactDeleted.emit();
  }

  /**
   * Opens or closes the mobile options menu.
   *
   * @param event - DOM click event.
   */
  protected toggleMenu(event: Event): void {
    event.stopPropagation();
    this.menuOpen.update((open) => !open);
  }

  /** Closes the mobile options menu. */
  protected closeMenu(): void {
    this.menuOpen.set(false);
  }
}
