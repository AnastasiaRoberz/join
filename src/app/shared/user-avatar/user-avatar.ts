import { Component, computed, inject, input } from '@angular/core';
import { ContactInterface } from '../../interfaces/contact.interface';
import { ResponsiveService } from '../../services/responsive.service';

@Component({
  imports: [],
  selector: 'app-user-avatar',
  styleUrl: './user-avatar.scss',
  templateUrl: './user-avatar.html',
  host: {
    '[class]': "'size-' + size()",
    '[class.is-mobile]': 'responsiveService.isMobile()',
    '[style.background-color]': 'user()?.badge_color',
  },
})
export class UserAvatar {
  responsiveService = inject(ResponsiveService);

  user = input<Partial<ContactInterface> | null>(null);
  size = input<'small' | 'medium' | 'large' | 'header' | 'details'>('medium');

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
    const secondLetter = this.user()?.surname?.charAt(0);
    return `${firstLetter}${secondLetter}`;
  });
}
