import { inject, Injector, Service, Signal } from '@angular/core';
import { BreakpointObserver } from '@angular/cdk/layout';
import { toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs';

/**
 * Exposes screen-size information as signals, based on the CDK {@link BreakpointObserver}.
 *
 * The signals update automatically when the viewport changes and can be used directly in
 * templates or in `computed()`/`effect()`. They start with `false` until the first
 * observation result arrives.
 *
 * Note that the breakpoints are not mutually exclusive: below 768px both `isMobile()` and
 * `isTablet()` are `true` (`isTablet` means "at most 1024px wide").
 *
 * @example
 * responsive = inject(ResponsiveService);
 * // template: <div [class.is-mobile]="responsive.isMobile()"></div>
 */
@Service()
export class ResponsiveService {
  /** CDK service that observes media queries. */
  breakpointObserver = inject(BreakpointObserver);
  /** Injection context used by `isMaxWidth()` so `toSignal()` can be called outside of the constructor. */
  injector = inject(Injector);

  /** Media queries used by the signals below. Keep in sync with the SCSS breakpoints. */
  customBreakpoints = {
    mobile: '(max-width: 768px)',
    tablet: '(max-width: 1024px)',
    desktop: '(min-width: 1025px)',
    widescreen: '(min-height: 1800px)',
  };

  /** `true` when the viewport is at most 768px wide. */
  readonly isMobile = toSignal(
    this.breakpointObserver
      .observe(this.customBreakpoints.mobile)
      .pipe(map((result) => result.matches)),
    { initialValue: false },
  );

  /** `true` when the viewport is at most 1024px wide (also true on mobile). */
  readonly isTablet = toSignal(
    this.breakpointObserver
      .observe(this.customBreakpoints.tablet)
      .pipe(map((result) => result.matches)),
    { initialValue: false },
  );

  /** `true` when the viewport is at least 1025px wide. */
  readonly isDesktop = toSignal(
    this.breakpointObserver
      .observe(this.customBreakpoints.desktop)
      .pipe(map((result) => result.matches)),
    { initialValue: false },
  );

  /** `true` when the viewport is at least 1800px high (`min-height`, not width). */
  readonly isWidescreen = toSignal(
    this.breakpointObserver
      .observe(this.customBreakpoints.widescreen)
      .pipe(map((result) => result.matches)),
    { initialValue: false },
  );

  /**
   * Creates a signal for an arbitrary max-width breakpoint.
   * Each call creates a new observer/signal, so call it once (e.g. in a field initializer)
   * and reuse the result instead of calling it repeatedly (e.g. in a template).
   *
   * @param maxWidth - Maximum viewport width in pixels (inclusive).
   * @returns A signal that is `true` while the viewport is at most `maxWidth` px wide.
   * @example
   * isNarrow = inject(ResponsiveService).isMaxWidth(500);
   */
  isMaxWidth(maxWidth: number): Signal<boolean> {
    return toSignal(
      this.breakpointObserver
        .observe(`(max-width: ${maxWidth}px)`)
        .pipe(map((result) => result.matches)),
      {
        initialValue: false,
        injector: this.injector,
      },
    );
  }
}
