import { Component, effect, inject, input, signal } from '@angular/core';
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

@Component({
  imports: [ReactiveFormsModule, TextField, UserAvatar, Buttons],
  selector: 'app-contact-dialog',
  styleUrl: './contact-dialog.scss',
  templateUrl: './contact-dialog.html',
  host: {
    '[class.is-mobile]': 'responsiveService.isMobile()',
    '[class.is-tablet]': 'responsiveService.isTablet()',
  },
})
export class ContactDialog {
  supabaseService = inject(SupabaseService);
  contactService = inject(ContactService);
  dialogService = inject(DialogService);
  responsiveService = inject(ResponsiveService);
  fb = inject(FormBuilder);
  confirmService = inject(ConfirmService);
  isSubmitting = signal<boolean>(false);

  contact = input<ContactInterface | null>(null);

  contactForm = this.fb.group({
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

  constructor() {
    effect(() => {
      const currentContact = this.contact();
      if (currentContact) {
        this.contactForm.setValue({
          name: fullName(currentContact), // starting to use fullName for display purposes
          mail: currentContact.mail,
          phone: currentContact.phone,
        });
      } else {
        this.contactForm.reset();
      }
    });
  }

  async saveContact() {
    if (this.isSubmitting() || !this.contactForm.valid) return;

    this.isSubmitting.set(true);
    const { name, mail, phone } = this.contactForm.getRawValue();
    const { title, firstname, surname } = splitName(name ?? ''); // added title and using external splitName from name-utils
    const contactInfos = {
      title,
      firstname,
      surname,
      mail: mail?.trim() ?? '',
      phone: phone?.trim() ?? '',
    };

    const existingContact = this.contact();
    if (existingContact) {
      await this.contactService.updateContact(existingContact.id, contactInfos);
      this.dialogService.selectUpdatedContact(existingContact.id);
    } else {
      // Wait for Supabase to return the created contact including its server-generated id
      const newContact = await this.contactService.addContact(contactInfos);
      if (newContact) {
        // Pass the new contact's id to DialogService to trigger auto-selection and scroll
        this.dialogService.selectContact(newContact.id);
      }
    }

    this.closeDialog();
    this.isSubmitting.set(false);
  }

  // splitMame now moved to name-utils.ts

  async deleteAndClose() {
    const id = this.contact()?.id;
    if (this.isSubmitting() || !id) return;
    if (!(await this.confirmService.askDelete('Contact'))) return;

    this.isSubmitting.set(true);
    if (!id) return;

    await this.contactService.deleteContact(id);
    this.closeDialog();
    this.isSubmitting.set(false);
  }

  closeDialog(): void {
    this.dialogService.closeDialog();
    this.contactForm.reset();
  }
}
