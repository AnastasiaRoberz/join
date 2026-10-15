import { inject, Service } from '@angular/core';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs';

@Service()
export class ResponsiveService {
  private breakpointObserver = inject(BreakpointObserver);

  /*
   * (max-width: 599.98px) and (orientation: portrait)
   * (max-width: 959.98px) and (orientation: landscape)
   */
  readonly isMobile = toSignal(
    this.breakpointObserver.observe([Breakpoints.Handset]).pipe(map((result) => result.matches)),
    { initialValue: false },
  );

  /*
   * (min-width: 600px) and (max-width: 839.98px) and (orientation: portrait)
   * (min-width: 960px) and (max-width: 1279.98px) and (orientation: landscape)
   */
  readonly isTablet = toSignal(
    this.breakpointObserver.observe([Breakpoints.Tablet]).pipe(map((result) => result.matches)),
    { initialValue: false },
  );

  /*
   * (min-width: 840px) and (orientation: portrait)
   * (min-width: 1280px) and (orientation: landscape)
   */
  readonly isDesktop = toSignal(
    this.breakpointObserver.observe([Breakpoints.Web]).pipe(map((result) => result.matches)),
    { initialValue: false },
  );

  /*
   * (min-width: 1920px)
   */
  readonly isWidescreen = toSignal(
    this.breakpointObserver.observe([Breakpoints.XLarge]).pipe(map((result) => result.matches)),
    { initialValue: false },
  );
}
