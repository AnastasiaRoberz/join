import { Component, computed, ElementRef, inject, input, OnDestroy, OnInit, output, signal } from '@angular/core';
import { UserAvatar } from '../user-avatar/user-avatar';
import { ContactInterface } from '../../interfaces/contact.interface';
import { CursorTooltipDirective } from '../../directives/cursor-tooltip.directive';
import { Buttons } from '../button.component/button.component';

/**
 * Displays a group of user avatars in one of two layouts:
 * - **Overlapping (`overlapLayout = true`, default)**: Avatars partially overlap each other (compact
 *   stack). At most `maxUsers` avatars are shown; the rest are summarized in a `+N` badge whose
 *   tooltip lists the names of the hidden users. Typical use: card previews on the board.
 * - **Non-overlapping (`overlapLayout = false`)**:
 *   - **Collapsed (`isExpanded = false`, default)**: A horizontal row of avatars separated by a gap.
 *     The number of visible avatars adapts dynamically to the host width (measured via `ResizeObserver`),
 *     with a `+N` badge for overflow users. Hovering an avatar shows a delete button when `canDelete` is `true`.
 *   - **Expanded (`isExpanded = true`)**: Animates the avatars from the horizontal row into a vertical list
 *     displaying each user's avatar alongside their full name.
 *
 * @example
 * ### 1. Overlapping stack (e.g., on a task card)
 * ```html
 * <app-avatar-group [users]="task.assignedUsers" size="small" [maxUsers]="3" />
 * ```
 *
 * @example
 * ### 2. Removable users below a multi-select
 * ```html
 * <app-avatar-group
 *   [users]="selectedContacts()"
 *   size="medium"
 *   [overlapLayout]="false"
 *   (userDeletedId)="assignedSelect.deselect($event)"
 * />
 * ```
 *
 * @example
 * ### 3. Expandable user list in task details
 * ```html
 * <app-avatar-group
 *   [users]="task.assigned_users"
 *   size="medium"
 *   [overlapLayout]="false"
 *   [canDelete]="false"
 *   [isExpanded]="!moreUsers() || showAllUsers()"
 * />
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
export class AvatarGroupComponent implements OnInit, OnDestroy {
  // ---------------------------------------------------------------------------
  // Injected Dependencies & Internal State
  // ---------------------------------------------------------------------------

  /** Reference to the host element, observed by `ResizeObserver` to measure available width. */
  element = inject(ElementRef<HTMLElement>);

  /** Observer that keeps `containerWidth` up to date; created in `ngOnInit`, disconnected in `ngOnDestroy`. */
  resizeObserver?: ResizeObserver;

  /**
   * Current content width of the host element in pixels (`0` until the first measurement).
   * Used in the non-overlapping layout to calculate how many avatars fit into a single row.
   */
  containerWidth = signal<number>(0);

  // ---------------------------------------------------------------------------
  // Inputs & Outputs
  // ---------------------------------------------------------------------------

  /** Users to display. Uses `id`, `firstname`, and `surname` for tracking, labels, and tooltips. */
  users = input<Partial<ContactInterface>[]>([]);

  /** Avatar size: `'small'` (32px) or `'medium'` (42px). Bound as a CSS class on the host element. */
  size = input<'small' | 'medium'>('small');

  /**
   * Maximum number of avatars shown before collapsing the rest into the `+N` badge.
   * Applies to the overlapping layout and as a fallback before `containerWidth` is measured.
   */
  maxUsers = input<number>(3);

  /**
   * `true` (default): Compact overlapping avatar stack.
   * `false`: Non-overlapping layout (`no-overlap` host class) supporting horizontal row or expanded vertical list.
   */
  overlapLayout = input<boolean>(true);

  /** Whether hovering an avatar in the non-overlapping layout displays a delete button. */
  canDelete = input<boolean>(true);

  /** Whether the non-overlapping layout is expanded into a vertical list showing full user names. */
  isExpanded = input<boolean>(false);

  /** Horizontal spacing in pixels between avatars used for the `fittingUsers` width calculation. */
  gap = input<number>(8);

  /** Emits the `id` of the user whose delete button was clicked (when `canDelete` is `true`). */
  userDeletedId = output<number>();

  // ---------------------------------------------------------------------------
  // Computed State
  // ---------------------------------------------------------------------------

  /**
   * Number of avatars that fit before the `+N` badge:
   * - Overlapping layout or unmeasured width (`<= 0`): `maxUsers()`.
   * - Non-overlapping layout: as many avatars as fit into `containerWidth()` based on avatar width
   *   (32px for `small`, 42px for `medium`) and `gap()`, reserving one slot for the `+N` badge if needed.
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

  /** Slice of `users()` rendered in the overlapping layout (`0` up to `fittingUsers()`). */
  visibleUsers = computed(() => this.users().slice(0, this.fittingUsers()));

  /**
   * Line-separated full names (`firstname surname`) of all users hidden in the `+N` badge.
   * Used as the tooltip text of the `+N` badge.
   */
  remainingUsers = computed(() => {
    return this.users()
      .slice(this.fittingUsers())
      .map((user) => `${user?.firstname} ${user?.surname}`)
      .join('\n');
  });

  /** Number of users hidden behind the `+N` badge; the badge is only rendered when `> 0`. */
  remainingUsersCount = computed(() => Math.max(0, this.users().length - this.fittingUsers()));

  /** True if at least one user is present; controls the host top margin via `.has-users`. */
  protected hasUsers = computed(() => this.visibleUsers().length > 0);

  // ---------------------------------------------------------------------------
  // Lifecycle
  // ---------------------------------------------------------------------------

  /** Starts a `ResizeObserver` on the host element to dynamically update `containerWidth`. */
  ngOnInit(): void {
    this.resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        this.containerWidth.set(entry.contentRect.width);
      }
    });
    this.resizeObserver.observe(this.element.nativeElement);
  }

  /** Disconnects the `ResizeObserver` when the component is destroyed. */
  ngOnDestroy(): void {
    this.resizeObserver?.disconnect();
  }

  // ---------------------------------------------------------------------------
  // Public Methods
  // ---------------------------------------------------------------------------

  /**
   * Handles clicks on the per-avatar delete button. Stops event propagation to parent elements
   * and emits `userDeletedId` if a valid user `id` is provided.
   */
  onDelete(id?: number, event?: MouseEvent): void {
    event?.stopPropagation();
    if (id) this.userDeletedId.emit(id);
  }
}
