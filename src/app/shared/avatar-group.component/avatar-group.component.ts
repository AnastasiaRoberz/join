import { Component, computed, ElementRef, inject, input, output, signal } from '@angular/core';
import { UserAvatar } from '../user-avatar/user-avatar';
import { ContactInterface } from '../../interfaces/contact.interface';
import { CursorTooltipDirective } from '../../directives/cursor-tooltip.directive';
import { Buttons } from '../button.component/button.component';

@Component({
  imports: [UserAvatar, CursorTooltipDirective, Buttons],
  selector: 'app-avatar-group',
  styleUrl: './avatar-group.component.scss',
  templateUrl: './avatar-group.component.html',
  host: {
    '[class]': 'size()',
    '[class.no-overlap]': '!overlapLayout()',
  },
})
export class AvatarGroupComponent {
  element = inject(ElementRef<HTMLElement>);
  resizeObserver?: ResizeObserver;

  containerWidth = signal<number>(0);

  users = input<Partial<ContactInterface>[]>([]);
  size = input<'small' | 'medium'>('small');
  maxUsers = input<number>(3);
  overlapLayout = input<boolean>(true);
  gap = input<number>(8);
  userDeletedId = output<number>();

  ngOnInit(): void {
    this.resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        this.containerWidth.set(entry.contentRect.width);
      }
    });
    this.resizeObserver.observe(this.element.nativeElement);
  }

  ngOnDestroy(): void {
    this.resizeObserver?.disconnect();
  }

  fittingUsers = computed(() => {
    if (this.overlapLayout()) return this.maxUsers();

    const total = this.users().length;
    const width = this.containerWidth();
    if (width <= 0) return this.maxUsers();

    const itemWidth = this.size() === 'small' ? 32 : 42;
    const gap = this.gap();

    const maxFitting = Math.max(1, Math.floor((width + gap) / (itemWidth + gap)));
    if (total <= maxFitting) return total;

    return Math.max(1, maxFitting - 1);
  });

  visibleUsers = computed(() => this.users().slice(0, this.fittingUsers()));

  remainingUsers = computed(() => {
    return this.users()
      .slice(this.fittingUsers())
      .map((user) => `${user?.firstname} ${user?.surname}`)
      .join('\n');
  });
  remainingUsersCount = computed(() => Math.max(0, this.users().length - this.fittingUsers()));

  onDelete(id?: number, event?: MouseEvent) {
    event?.stopPropagation();
    if (id) this.userDeletedId.emit(id);
  }
}
