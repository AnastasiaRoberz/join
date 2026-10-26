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

    // titleRegex now lives in name-utils.ts

    const firstLetter = this.user()?.firstname.charAt(0);
    const secondLetter = this.user()?.surname.charAt(0);
    return `${firstLetter}${secondLetter}`;
  });
}
