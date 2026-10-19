import { Component, effect, inject, input, signal } from '@angular/core';
import { SupabaseService } from '../../../../../services/supabase';
import { Contact } from '../../../../../interfaces/contact';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { InputField } from '../../../../../shared/input-field/input-field';
import { UserAvatar } from '../../../../../shared/user-avatar/user-avatar';
import { DialogService } from '../../../../../services/dialog';
import {
  customMailValidator,
  customNameValidator,
  customPhoneValidator,
  generalCustomValidators,
  uniqueMailValidator,
} from '../../../../../utils/custom-validators';

@Component({
  imports: [ReactiveFormsModule, InputField, UserAvatar],
  selector: 'app-contact-dialog',
  styleUrl: './contact-dialog.scss',
  templateUrl: './contact-dialog.html',
})
export class ContactDialog {
  supabase = inject(SupabaseService);
  fb = inject(FormBuilder);
  dialogService = inject(DialogService);
  isSubmitting = signal<boolean>(false);

  contact = input<Contact | null>(null);

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
        asyncValidators: [uniqueMailValidator(this.supabase)],
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
          name: currentContact.firstname + ' ' + currentContact.surname,
          mail: currentContact.mail,
          phone: currentContact.phone ?? '',
        });
      } else {
        this.contactForm.reset();
      }
    });
  }

  async saveContact() {
    if (this.isSubmitting()) return;

    this.isSubmitting.set(true);
    const { name, mail, phone } = this.contactForm.getRawValue();
    const { firstname, surname } = this.splitName(name ?? '');
    const contactInfos = {
      firstname: firstname,
      surname: surname,
      mail: mail?.trim() ?? '',
      phone: phone?.trim() ?? '',
    };

    const existingContact = this.contact();
    if (existingContact) {
      await this.supabase.updateContact(existingContact.id ?? null, contactInfos);
    } else {
      await this.supabase.addContact(contactInfos);
    }

    await this.supabase.getAllContacts();
    this.closeDialog();
    this.isSubmitting.set(false);
  }

  splitName(name: string) {
    const lastSpaceIndex = name.lastIndexOf(' ');

    if (lastSpaceIndex === -1) return { firstname: name, surname: '' };

    return {
      firstname: name.substring(0, lastSpaceIndex).trim(),
      surname: name.substring(lastSpaceIndex + 1).trim(),
    };
  }

  async deleteAndClose() {
    if (this.isSubmitting()) return;

    this.isSubmitting.set(true);
    const id = this.contact()?.id;
    if (!id) return;

    await this.supabase.deleteContact(id);
    this.closeDialog();
    this.isSubmitting.set(false);
  }

  closeDialog(): void {
    this.dialogService.closeDialog();
    this.contactForm.reset();
  }
}
