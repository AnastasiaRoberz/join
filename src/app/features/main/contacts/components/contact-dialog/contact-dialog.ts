import { Component, effect, inject, input, signal } from '@angular/core';
import { ContactInterface } from '../../../../../interfaces/contact.interface';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { InputField } from '../../../../../shared/input-field/input-field';
import { UserAvatar } from '../../../../../shared/user-avatar/user-avatar';
import { DialogService } from '../../../../../services/dialog.service';
import { CustomValidators } from '../../../../../utils/custom-validators';
import { ContactService } from '../../../../../services/contact.service';

@Component({
  imports: [ReactiveFormsModule, InputField, UserAvatar],
  selector: 'app-contact-dialog',
  styleUrl: './contact-dialog.scss',
  templateUrl: './contact-dialog.html',
})
export class ContactDialog {
  contactService = inject(ContactService);
  dialogService = inject(DialogService);
  fb = inject(FormBuilder);
  isSubmitting = signal<boolean>(false);

  contact = input<ContactInterface | null>(null);

  contactForm = this.fb.group({
    name: [
      '',
      {
        validators: [
          Validators.required,
          CustomValidators.noWhitespace(),
          CustomValidators.onlyLetters(),
          CustomValidators.twoNames(),
        ],
      },
    ],
    mail: [
      '',
      {
        validators: [
          Validators.required,
          CustomValidators.noWhitespace(),
          CustomValidators.customEmail(),
        ],
      },
    ],
    phone: [
      '',
      {
        validators: [
          Validators.required,
          CustomValidators.noWhitespace(),
          CustomValidators.phone(),
        ],
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
          phone: currentContact.phone,
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
      mail: mail ?? '',
      phone: phone ?? '',
    };

    const existingContact = this.contact();
    if (existingContact) {
      await this.contactService.updateContact(existingContact.id, contactInfos);
    } else {
      await this.contactService.addContact(contactInfos);
    }

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

    await this.contactService.deleteContact(id);
    this.closeDialog();
    this.isSubmitting.set(false);
  }

  closeDialog(): void {
    this.dialogService.closeDialog();
    this.contactForm.reset();
  }
}
