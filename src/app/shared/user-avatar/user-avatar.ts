import { Component, computed, input } from '@angular/core';
import { Contact } from '../../interfaces/contact';

@Component({
  imports: [],
  selector: 'app-user-avatar',
  styleUrl: './user-avatar.scss',
  templateUrl: './user-avatar.html',
})
export class UserAvatar {
  user = input<Contact | null>(null);
  size = input<'small' | 'medium' | 'large'>('medium');

  initials = computed(() => {
    if (!this.user()) return '';

    // Liste gängiger akademischer Titel und Anreden (Groß-/Kleinschreibung und Punkte beachten)
    const titleRegex =
      /^(prof\.?|dr\.?|med\.?|dent\.?|habil\.?|rer\.?|nat\.?|ing\.?|iur\.?|jur\.?|theol\.?|phil\.?|mba|bsc|msc|ba|ma|dipl\.?(-ing\.?)?)\s+/i;

    let firstname = (this.user()?.firstname ?? '').trim();
    while (titleRegex.test(firstname)) {
      firstname = firstname.replace(titleRegex, '').trim();
    }

    const firstLetter = firstname.charAt(0);
    const secondLetter = this.user()?.surname.charAt(0);
    return `${firstLetter}${secondLetter}`;
  });
}
