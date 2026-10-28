import { Component, computed, inject, input } from '@angular/core';
import { ContactInterface } from '../../interfaces/contact.interface';
import { ResponsiveService } from '../../services/responsive.service';

/**
 * Round avatar showing the initials of a contact on the contact's badge color.
 *
 * Display rules (see template):
 * - `user` set: the initials (first letter of `firstname` + first letter of `surname`).
 * - no `user` and `size === 'header'`: a fixed "G" (guest user in the header).
 * - otherwise: a generic person icon from `assets/icons/icons.svg`.
 *
 * The host element gets the CSS class `size-<size>`, the class `is-mobile` on small screens
 * and the contact's `badge_color` as background color.
 *
 * Inputs:
 * - `user`: a (partial) contact. Only `firstname`, `surname` and `badge_color` are used.
 * - `size`: `'small'` | `'medium'` (default) | `'large'` | `'header'` | `'details'`.
 *
 * @example
 * <app-user-avatar [user]="contact" size="small"></app-user-avatar>
 * <app-user-avatar size="header"></app-user-avatar>
 */
@Component({
  imports: [],
  selector: 'app-user-avatar',
  styleUrl: './user-avatar.scss',
  templateUrl: './user-avatar.html',
  host: {
    '[class]': "'size-' + size()",
    '[style.background-color]': 'user()?.badge_color',
  },
})
export class UserAvatar {
  /** Provides the screen-size signals used for the mobile styling. */
  responsiveService = inject(ResponsiveService);

  /** Contact to display. `null` shows the guest "G" (header size) or the person icon. */
  user = input<Partial<ContactInterface> | null>(null);
  /** Avatar size variant; applied as the CSS class `size-<size>` on the host element. */
  size = input<'small' | 'medium' | 'large' | 'header' | 'details'>('medium');

  /**
   * Initials of the current user: first letter of `firstname` followed by first letter of `surname`.
   * Returns an empty string when no user is set.
   * Note: a missing name part is not guarded and would be rendered as the text "undefined".
   */
  initials = computed(() => {
    if (!this.user()) return '';

    // titleRegex now lives in name-utils.ts

    const firstLetter = this.user()?.firstname?.charAt(0);
    const secondLetter = this.user()?.surname?.charAt(0);
    return `${firstLetter}${secondLetter}`;
  });
}
