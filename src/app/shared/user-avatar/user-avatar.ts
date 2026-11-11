import { Component, computed, input } from '@angular/core';
import { ContactInterface } from '../../interfaces/contact.interface';

/** Avatar size options. */
export type AvatarSize = 'small' | 'medium' | 'large' | 'header';

/**
 * Round avatar showing the initials of a contact on the contact's badge color.
 *
 * Display rules (see template):
 * - `user` set: initials (first letter of `firstname` + first letter of `surname`, or 'G' if a name part is missing).
 * - `user` null/undefined: a generic person icon from `assets/icons/icons.svg`.
 *
 * The host element receives the CSS class `size-<size>`, dynamic background color, and border color.
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
    '[style.background-color]': 'hostBackground()',
    '[style.border-color]': 'hostBorder()',
  },
})
export class UserAvatar {
  /** Contact to display. `null` renders the fallback person icon. */
  public readonly user = input<Partial<ContactInterface> | null>(null);

  /** Avatar size variant; applied as the CSS class `size-<size>` on the host element. */
  public readonly size = input<AvatarSize>('medium');

  /**
   * Initials of the current user: first letter of `firstname` followed by first letter of `surname`.
   * Returns 'G' if a name part is missing, or empty string when no user is provided.
   */
  protected readonly initials = computed<string>(() => {
    if (!this.user()) return '';
    const firstLetter = this.user()?.firstname?.charAt(0);
    const secondLetter = this.user()?.surname?.charAt(0);
    if (!firstLetter || !secondLetter) return 'G';
    return `${firstLetter}${secondLetter}`;
  });

  /**
   * Computes the background color based on avatar size and contact badge color.
   *
   * @returns CSS color value or undefined.
   */
  protected hostBackground(): string | undefined {
    return this.size() === 'header' ? 'transparent' : this.user()?.badge_color;
  }

  /**
   * Computes the border color based on avatar size and contact badge color.
   *
   * @returns CSS border color value or undefined.
   */
  protected hostBorder(): string | undefined {
    return this.size() === 'header' ? this.user()?.badge_color : undefined;
  }
}
