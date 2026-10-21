import { Component, computed, input } from '@angular/core';
import { UserAvatar } from '../user-avatar/user-avatar';
import { ContactInterface } from '../../interfaces/contact.interface';
import { CursorTooltipDirective } from '../../directives/cursor-tooltip.directive';

@Component({
  imports: [UserAvatar, CursorTooltipDirective],
  selector: 'app-avatar-group',
  styleUrl: './avatar-group.component.scss',
  templateUrl: './avatar-group.component.html',
  host: {
    '[class]': '`${size}`',
  },
})
export class AvatarGroupComponent {
  users = input<Partial<ContactInterface>[]>([]);

  size = input<'small' | 'medium'>('small');
  maxUsers = input<number>(3);

  visibleUsers = computed(() => this.users().slice(0, this.maxUsers()));
  remainingUsers = computed(() => {
    return this.users()
      .slice(this.maxUsers())
      .map((user) => `${user?.firstname} ${user?.surname}`)
      .join('\n');
  });
  remainingUsersCount = computed(() => this.users().length - this.maxUsers());
}
