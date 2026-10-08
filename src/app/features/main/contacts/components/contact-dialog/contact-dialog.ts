import { Component, effect, inject, input } from '@angular/core';
import { Supabase } from '../../../../../services/supabase';
import { Contact } from '../../../../../interfaces/contact';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { InputField } from '../../../../../shared/input-field/input-field';

@Component({
  imports: [ReactiveFormsModule, InputField],
  selector: 'app-contact-dialog',
  styleUrl: './contact-dialog.scss',
  templateUrl: './contact-dialog.html',
})
export class ContactDialog {
  supabase = inject(Supabase);
  fb = inject(FormBuilder);

  contact = input<Contact | null>(null);
  initials = '';

  contactForm = this.fb.group({
    name: '',
    mail: '',
    phone: '',
  });

  constructor() {
    effect(() => {
      const currentContact = this.contact();
      if (currentContact) {
        this.initials = this.supabase.getInitials(currentContact);
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
      await this.supabase.updateContact(existingContact.id ?? null, contactInfos);
    } else {
      await this.supabase.addContact(contactInfos);
    }
  }

  splitName(name: string) {
    const lastSpaceIndex = name.lastIndexOf(' ');

    if (lastSpaceIndex === -1) return { firstname: name, surname: '' };

    return {
      firstname: name.substring(0, lastSpaceIndex).trim(),
      surname: name.substring(lastSpaceIndex + 1).trim(),
    };
  }
}
