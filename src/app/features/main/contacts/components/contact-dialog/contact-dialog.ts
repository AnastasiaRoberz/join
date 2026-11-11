import { Component, computed, effect, inject, signal } from '@angular/core';
import { ContactInterface } from '../../../../../interfaces/contact.interface';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { TextField } from '../../../../../shared/text-field/text-field';
import { UserAvatar } from '../../../../../shared/user-avatar/user-avatar';
import { DialogService } from '../../../../../services/dialog.service';
import {
  customMailValidator,
  customNameValidator,
  customPhoneValidator,
  generalCustomValidators,
  uniqueMailValidator,
} from '../../../../../utils/custom-validators';
import { ResponsiveService } from '../../../../../services/responsive.service';
import { Buttons } from '../../../../../shared/button.component/button.component';
import { ContactService } from '../../../../../services/contact.service';
import { SupabaseService } from '../../../../../services/supabase.service';
import { ConfirmService } from '../../../../../services/confirm.service';
import { fullName, splitName } from '../../../../../utils/name-utils';
import { UserService } from '../../../../../services/user.service';
import { capitalizeFirstLetter } from '../../../../../utils/utils';

/**
 * Dialog for creating a new contact or editing an existing contact.
 */
@Component({
  imports: [ReactiveFormsModule, TextField, UserAvatar, Buttons],
  selector: 'app-contact-dialog',
  styleUrl: './contact-dialog.scss',
  templateUrl: './contact-dialog.html',
})
export class ContactDialog {
  /** Supabase service for unique email validation queries. */
  private readonly supabaseService = inject(SupabaseService);

  /** Contact service managing contacts persistence. */
  private readonly contactService = inject(ContactService);

  /** User service managing user account deletion. */
  private readonly userService = inject(UserService);

  /** Dialog service managing dialog open state and selected contact. */
  protected readonly dialogService = inject(DialogService);

  /** Responsive service for mobile/desktop layout switches. */
  protected readonly responsiveService = inject(ResponsiveService);

  /** Form builder instance for reactive form group creation. */
  private readonly fb = inject(FormBuilder);

  /** Confirmation service for delete confirmations. */
  private readonly confirmService = inject(ConfirmService);

  /** Submitting flag to prevent duplicate submissions. */
  protected readonly isSubmitting = signal<boolean>(false);

  /** Contact currently being edited, or null when creating a new contact. */
  protected readonly contact = computed(
    () => this.dialogService.selectedItem() as ContactInterface,
  );

  /** Reactive contact form group with validators. */
  protected readonly contactForm = this.fb.group({
    name: [
      '',
      {
        validators: [Validators.required, generalCustomValidators(), customNameValidator()],
      },
    ],
    mail: [
      '',
      {
        validators: [Validators.required, generalCustomValidators(), customMailValidator()],
        asyncValidators: [uniqueMailValidator(this.supabaseService, () => this.contact()?.id)],
      },
    ],
    phone: [
      '',
      {
        validators: [Validators.required, generalCustomValidators(), customPhoneValidator()],
      },
    ],
  });

  /** Initializes reactive effect to synchronize form fields when active contact changes. */
  constructor() {
    this.initFormSyncEffect();
  }

  /**
   * Saves contact changes or creates a new contact, then selects it and closes the dialog.
   */
  protected async saveContact(): Promise<void> {
    if (this.isSubmitting() || !this.contactForm.valid) return;

    this.isSubmitting.set(true);
    await this.persistContact(this.buildContactPayload());
    this.closeDialog();
    this.isSubmitting.set(false);
  }

  /**
   * Deletes the currently selected contact after confirmation and closes the dialog.
   */
  protected async deleteAndClose(): Promise<void> {
    const id = this.contact()?.id;
    if (this.isSubmitting() || !id) return;
    if (!(await this.confirmService.askDelete('Contact'))) return;

    this.isSubmitting.set(true);
    await this.userService.deleteUser(id, this.contact()?.user_uid);
    this.closeDialog();
    this.isSubmitting.set(false);
  }

  /** Closes the contact dialog and resets the form. */
  protected closeDialog(): void {
    this.dialogService.closeDialog();
    this.contactForm.reset();
  }

  /** Builds the normalized contact data payload from the reactive form. */
  private buildContactPayload(): Omit<ContactInterface, 'id' | 'badge_color'> {
    const { name, mail, phone } = this.contactForm.getRawValue();
    const { title, firstname, surname } = splitName(name ?? '');

    return {
      title,
      firstname: capitalizeFirstLetter(firstname),
      surname: capitalizeFirstLetter(surname),
      mail: mail?.trim() ?? '',
      phone: phone?.trim() ?? '',
    };
  }

  /**
   * Persists contact updates or creations to Supabase and selects the resulting contact.
   *
   * @param contactInfos - Contact payload excluding id and badge_color.
   */
  private async persistContact(
    contactInfos: Omit<ContactInterface, 'id' | 'badge_color'>,
  ): Promise<void> {
    const existingContact = this.contact();
    if (existingContact) {
      await this.contactService.updateContact(existingContact.id, contactInfos);
      if (existingContact.user_uid) await this.syncAuthUser(existingContact.user_uid, contactInfos);
      this.dialogService.selectContact(existingContact.id);
    } else {
      const newContact = await this.contactService.addContact(contactInfos);
      if (newContact) this.dialogService.selectContact(newContact.id);
    }
  }

  /**
   * Syncs contact changes to the currently logged-in Supabase auth user.
   *
   * @param uid - User UID in auth.users.
   * @param infos - Contact metadata.
   */
  private async syncAuthUser(
    uid: string,
    infos: Omit<ContactInterface, 'id' | 'badge_color'>,
  ): Promise<void> {
    const currentMail = this.userService.currentUser()?.email;
    await this.userService.updateUser(uid, {
      ...(infos.mail !== currentMail ? { email: infos.mail } : {}),
      data: { first_name: infos.firstname, full_name: infos.surname },
    });
  }

  /** Synchronizes form field values when switching between contacts or opening for new contact. */
  private initFormSyncEffect(): void {
    effect(() => {
      const currentContact = this.contact();
      if (currentContact) {
        this.contactForm.setValue({
          name: fullName(currentContact),
          mail: currentContact.mail,
          phone: currentContact.phone,
        });
      } else {
        this.contactForm.reset();
      }
    });
  }
}
