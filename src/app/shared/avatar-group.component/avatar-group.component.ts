import {
  Component,
  computed,
  ElementRef,
  inject,
  input,
  OnDestroy,
  OnInit,
  output,
  signal,
} from '@angular/core';
import { UserAvatar } from '../user-avatar/user-avatar';
import { ContactInterface } from '../../interfaces/contact.interface';
import { CursorTooltipDirective } from '../../directives/cursor-tooltip.directive';
import { Buttons } from '../button.component/button.component';
import { FitTextDirective } from '../../directives/fit-text.directive';
import { ResponsiveService } from '../../services/responsive.service';

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
 * <app-avatar-group [users]="task.assigned_users" size="small" [maxUsers]="3" />
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
  imports: [UserAvatar, CursorTooltipDirective, Buttons, FitTextDirective],
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
    '[style.--columns]': 'remainingUsersCount() > 0 ? fittingUsers() + 1 : fittingUsers()',
    '[style.--avatar-gap.px]': 'computedGap()',
    '[style.display]': '!hasUsers() ? "none" : null',
  },
})
export class AvatarGroupComponent implements OnInit, OnDestroy {
  // ---------------------------------------------------------------------------
  // Injected Dependencies & Internal State
  // ---------------------------------------------------------------------------

  /** Responsive service for breakpoint detection. */
  protected readonly responsiveService = inject(ResponsiveService);

  /** Responsive signal indicating very narrow viewports (< 350px). */
  protected readonly isMaxWidth = this.responsiveService.isMaxWidth(350);

  /** Reference to the host element, observed by `ResizeObserver` to measure available width. */
  private readonly element = inject<ElementRef<HTMLElement>>(ElementRef);

  /** Observer that keeps `containerWidth` up to date; created in `ngOnInit`, disconnected in `ngOnDestroy`. */
  private resizeObserver?: ResizeObserver;

  /**
   * Current content width of the host element in pixels (`0` until the first measurement).
   * Used in the non-overlapping layout to calculate how many avatars fit into a single row.
   */
  private readonly containerWidth = signal<number>(0);

  /** Tracks current viewport width to compute the responsive avatar size matching `calcClamp(32, 42)`. */
  private readonly windowWidth = signal<number>(
    typeof window !== 'undefined' ? window.innerWidth : 1440,
  );

  /** Window resize listener to keep `windowWidth` reactive. */
  private readonly onWindowResize = (): void => {
    if (typeof window !== 'undefined') {
      this.windowWidth.set(window.innerWidth);
    }
  };

  // ---------------------------------------------------------------------------
  // Inputs & Outputs
  // ---------------------------------------------------------------------------

  /** Users to display. Uses `id`, `firstname`, and `surname` for tracking, labels, and tooltips. */
  public readonly users = input<Partial<ContactInterface>[]>([]);

  /** Avatar size: `'small'` (32px) or `'medium'` (42px). Bound as a CSS class on the host element. */
  public readonly size = input<'small' | 'medium'>('small');

  /**
   * Maximum number of avatars shown before collapsing the rest into the `+N` badge.
   * Applies to the overlapping layout and as a fallback before `containerWidth` is measured.
   */
  public readonly maxUsers = input<number>(3);

  /**
   * `true` (default): Compact overlapping avatar stack.
   * `false`: Non-overlapping layout (`no-overlap` host class) supporting horizontal row or expanded vertical list.
   */
  public readonly overlapLayout = input<boolean>(true);

  /** Whether hovering an avatar in the non-overlapping layout displays a delete button. */
  public readonly canDelete = input<boolean>(true);

  /** Whether the non-overlapping layout is expanded into a vertical list showing full user names. */
  public readonly isExpanded = input<boolean>(false);

  /** Emits the `id` of the user whose delete button was clicked (when `canDelete` is `true`). */
  public readonly userDeletedId = output<number>();

  // ---------------------------------------------------------------------------
  // Computed State
  // ---------------------------------------------------------------------------

  /**
   * Clamped pixel size of a single avatar matching SCSS `calcClamp(32, 42)`.
   * For 'small' it is always 32px; for 'medium' it scales between 32px (320px viewport) and 42px (1440px+ viewport).
   */
  private readonly avatarSize = computed<number>(() => {
    if (this.size() === 'small') return 32;
    const vw = this.windowWidth();
    const clamped = 32 + ((vw - 320) * (42 - 32)) / (1440 - 320);
    return Math.min(42, Math.max(32, Math.round(clamped)));
  });

  /**
   * Number of avatars that fit before the `+N` badge:
   * - Overlapping layout or unmeasured width (`<= 0`): `maxUsers()`.
   * - Non-overlapping layout: as many avatars as fit into `containerWidth()` based on `avatarSize()`.
   */
  protected readonly fittingUsers = computed<number>(() => {
    if (this.overlapLayout()) return this.maxUsers();
    const total = this.users().length;
    if (total === 0) return 0;
    const width = this.containerWidth();
    if (width <= 0) return this.maxUsers();
    return this.calculateMaxFittingAvatars(width, total);
  });

  /**
   * Dynamically calculated gap between avatars in the non-overlapping layout:
   * Distributes remaining width evenly among visible items so avatars span the container.
   * Clamped between 8px and 16px.
   */
  protected readonly computedGap = computed<number>(() => {
    if (this.overlapLayout() || this.isExpanded()) return 8;
    const width = this.containerWidth();
    if (width <= 0) return 8;
    const fitting = this.fittingUsers();
    const hasRemaining = this.remainingUsersCount() > 0;
    const visibleCount = fitting + (hasRemaining ? 1 : 0);
    if (visibleCount <= 1) return 8;
    return this.calculateClampedGap(width, visibleCount);
  });

  /** Slice of `users()` rendered in the overlapping layout (`0` up to `fittingUsers()`). */
  protected readonly visibleUsers = computed<Partial<ContactInterface>[]>(() =>
    this.users().slice(0, this.fittingUsers()),
  );

  /**
   * Line-separated full names (`firstname surname`) of all users hidden in the `+N` badge.
   * Used as the tooltip text of the `+N` badge.
   */
  protected readonly remainingUsers = computed<string>(() => {
    return this.users()
      .slice(this.fittingUsers())
      .map((user) => `${user?.firstname} ${user?.surname}`)
      .join('\n');
  });

  /** Number of users hidden behind the `+N` badge; the badge is only rendered when `> 0`. */
  protected readonly remainingUsersCount = computed<number>(() =>
    Math.max(0, this.users().length - this.fittingUsers()),
  );

  /** True if at least one user is present; controls the host top margin via `.has-users`. */
  protected readonly hasUsers = computed<boolean>(() => this.visibleUsers().length > 0);

  // ---------------------------------------------------------------------------
  // Lifecycle
  // ---------------------------------------------------------------------------

  /** Starts a `ResizeObserver` on the host element and listens for window resize events. */
  public ngOnInit(): void {
    if (typeof window !== 'undefined') {
      this.windowWidth.set(window.innerWidth);
      window.addEventListener('resize', this.onWindowResize);
    }
    this.resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        this.containerWidth.set(entry.contentRect.width);
      }
    });
    this.resizeObserver.observe(this.element.nativeElement);
  }

  /** Disconnects the `ResizeObserver` and window listener when the component is destroyed. */
  public ngOnDestroy(): void {
    if (typeof window !== 'undefined') {
      window.removeEventListener('resize', this.onWindowResize);
    }
    this.resizeObserver?.disconnect();
  }

  // ---------------------------------------------------------------------------
  // Event Handlers & Helpers
  // ---------------------------------------------------------------------------

  /**
   * Handles clicks on the per-avatar delete button. Stops event propagation to parent elements
   * and emits `userDeletedId` if a valid user `id` is provided.
   */
  protected onDelete(id?: number, event?: MouseEvent): void {
    event?.stopPropagation();
    if (id) this.userDeletedId.emit(id);
  }

  /** Calculates how many avatars can fit in the non-overlapping layout with minimum gap of 8px. */
  private calculateMaxFittingAvatars(width: number, total: number): number {
    const itemWidth = this.avatarSize();
    const minGap = 8;
    const maxFitting = Math.max(1, Math.floor((width + minGap) / (itemWidth + minGap)));
    return total <= maxFitting ? total : Math.max(1, maxFitting - 1);
  }

  /** Distributes remaining width evenly among visible items, clamped between 8px and 16px. */
  private calculateClampedGap(width: number, visibleCount: number): number {
    const itemWidth = this.avatarSize();
    const availableForGaps = width - visibleCount * itemWidth;
    const gapsCount = visibleCount - 1;
    const rawGap = availableForGaps / gapsCount;
    return Math.min(16, Math.max(8, Math.floor(rawGap * 10) / 10));
  }
}
