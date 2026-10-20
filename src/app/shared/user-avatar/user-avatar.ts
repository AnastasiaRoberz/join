import { Component, computed, input } from '@angular/core';
import { ContactInterface } from '../../interfaces/contact.interface';

@Component({
  imports: [],
  selector: 'app-user-avatar',
  styleUrl: './user-avatar.scss',
  templateUrl: './user-avatar.html',
})
export class UserAvatar {
  user = input<Partial<ContactInterface> | null>(null);
  size = input<'small' | 'medium' | 'large'>('medium');

  initials = computed(() => {
    if (!this.user()) return '';
    const firstLetter = this.user()?.firstname?.charAt(0);
    const secondLetter = this.user()?.surname?.charAt(0);
    return `${firstLetter}${secondLetter}`;
  });
}
