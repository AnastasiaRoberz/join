import { Component, computed, ElementRef, inject, input, output, signal } from '@angular/core';
import { UserAvatar } from '../user-avatar/user-avatar';
import { ContactInterface } from '../../interfaces/contact.interface';
import { CursorTooltipDirective } from '../../directives/cursor-tooltip.directive';
import { Buttons } from '../button.component/button.component';

/**
 * Displays a group of user avatars, in one of two layouts:
 * - **Overlapping (`overlapLayout = true`, default)**: avatars partially overlap each other (compact
 *   stack). At most `maxUsers` avatars are shown; the rest is summarized in a `+N` badge whose
 *   tooltip lists the names of the hidden users. Typical use: card previews on the board.
 * - **Non-overlapping (`overlapLayout = false`)**: a row of avatars separated by a gap. The number of
 *   avatars adapts to the available width of the host element (measured with a `ResizeObserver`),
 *   with a `+N` badge for the users that do not fit. Hovering an avatar shows a delete button that
 *   emits `userDeletedId`. Typical use: the list of assigned users below a select field.
 *
 * Every avatar has a cursor tooltip with the full name of the user. The host element receives the
 * `size` value (`small` / `medium`) as CSS class and the `no-overlap` class when `overlapLayout` is `false`.
 *
 * The delete buttons are `<button appBtn>` elements. `appBtn` renders `type="button"` by default
 * (see `Buttons.btnType`), so they never submit a surrounding `<form>`. The click is additionally
 * stopped from propagating (see `onDelete`), so parent click handlers (e.g. opening a card) are not triggered.
 *
 * @example
 * ### 1. Overlapping stack (e.g., on a task card)
 * ```html
 * <app-avatar-group [users]="task.assignedUsers" size="small" [maxUsers]="3" />
 * ```
 *
 * @example
 * ### 2. Removable users below a multi-select (footer slot of the select field)
 * ```html
 * <app-select-field #assignedSelect [multi]="true" [(value)]="selectedIds" [options]="contacts()">
 *   <app-avatar-group
 *     footer
 *     [users]="selectedContacts()"
 *     size="medium"
 *     [overlapLayout]="false"
 *     (userDeletedId)="assignedSelect.deselect($event)"
 *   />
 * </app-select-field>
 * ```
 */
@Component({
  imports: [UserAvatar, CursorTooltipDirective, Buttons],
  selector: 'app-avatar-group',
  styleUrl: './avatar-group.component.scss',
  templateUrl: './avatar-group.component.html',
  host: {
    '[class]': 'size()',
    '[class.no-overlap]': '!overlapLayout()',
    '[class.has-users]': 'hasUsers()',
    '[class.expanded]': 'isExpanded()',
    '[style.--total-users]': 'users().length',
    '[style.--fitting-users]': 'fittingUsers()',
  },
})
export class AvatarGroupComponent {
  /** Reference to the host element, observed by the `ResizeObserver` to measure the available width. */
  element = inject(ElementRef<HTMLElement>);

  /** Observer that keeps `containerWidth` up to date; created in `ngOnInit`, disconnected in `ngOnDestroy`. */
  resizeObserver?: ResizeObserver;

  /**
   * Current content width of the host element in pixels (`0` until the first measurement).
   * Only used in the non-overlapping layout to calculate how many avatars fit (see `fittingUsers`).
   */
  containerWidth = signal<number>(0);

  /**
   * Users to display. Partial contacts are accepted; `id`, `firstname` and `surname` are used
   * (id for tracking/deleting, names for the tooltips), the rest is handled by `app-user-avatar`.
   */
  users = input<Partial<ContactInterface>[]>([]);

  /** Avatar size: `'small'` (32px) or `'medium'` (42px). Also set as CSS class on the host element. */
  size = input<'small' | 'medium'>('small');

  /**
   * Maximum number of avatars shown before collapsing the rest into the `+N` badge.
   * Only applies to the overlapping layout (and as fallback while the width is unknown).
   */
  maxUsers = input<number>(3);

  /**
   * `true` (default): avatars overlap, no delete buttons.
   * `false`: avatars are laid out in a row (host class `no-overlap`) with a delete button on hover.
   */
  overlapLayout = input<boolean>(true);
  canDelete = input<boolean>(true);
  isExpanded = input<boolean>(false);

  /**
   * Horizontal spacing in pixels between avatars, used only for the "how many fit" calculation in
   * `fittingUsers` (non-overlapping layout). It does not change the CSS gap, which is defined in the stylesheet.
   */
  gap = input<number>(8);

  /**
   * Emits the `id` of the user whose delete button was clicked (non-overlapping layout only).
   * Typically wired to a select field: `(userDeletedId)="assignedSelect.deselect($event)"`.
   */
  userDeletedId = output<number>();

  /**
   * Starts a `ResizeObserver` on the host element that writes its width to `containerWidth`,
   * so the number of visible avatars can adapt when the container is resized.
   */
  ngOnInit(): void {
    this.resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        this.containerWidth.set(entry.contentRect.width);
      }
    });
    this.resizeObserver.observe(this.element.nativeElement);
  }

  /** Disconnects the `ResizeObserver` to avoid leaks after the component is destroyed. */
  ngOnDestroy(): void {
    this.resizeObserver?.disconnect();
  }

  /**
   * Number of avatars that are rendered before the `+N` badge.
   * - Overlapping layout, or width not yet measured (`<= 0`): `maxUsers()`.
   * - Non-overlapping layout: as many avatars as fit into `containerWidth()`, assuming a fixed item
   *   width of 32px (`small`) or 42px (`medium`) plus `gap()`; at least 1. If all users fit, all are shown;
   *   otherwise one slot is reserved for the `+N` badge (`fitting - 1`, but never less than 1).
   */
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

  /** The first `fittingUsers()` users, i.e. the ones that are rendered as avatars. */
  visibleUsers = computed(() => this.users().slice(0, this.fittingUsers()));

  /**
   * Full names (`firstname surname`) of all users that do not fit, separated by line breaks (`\n`).
   * Used as the tooltip text of the `+N` badge.
   */
  remainingUsers = computed(() => {
    return this.users()
      .slice(this.fittingUsers())
      .map((user) => `${user?.firstname} ${user?.surname}`)
      .join('\n');
  });

  /** Number of users hidden behind the `+N` badge; the badge is only rendered when this is greater than 0. */
  remainingUsersCount = computed(() => Math.max(0, this.users().length - this.fittingUsers()));

  /** True if at least one user visible - controls margin-top on host */
  protected hasUsers = computed(() => this.visibleUsers().length > 0);

  /**
   * Click handler of the delete button. Stops the click from bubbling to parent elements and
   * emits `userDeletedId` with the given id. Nothing is emitted for a falsy id (`undefined`, `0`).
   *
   * @param id - The id of the user to remove.
   * @param event - The click event of the delete button.
   */
  onDelete(id?: number, event?: MouseEvent) {
    event?.stopPropagation();
    if (id) this.userDeletedId.emit(id);
  }
}
