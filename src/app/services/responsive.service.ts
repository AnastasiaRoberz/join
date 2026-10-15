import { inject, Service } from '@angular/core';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs';

@Service()
export class ResponsiveService {
  private breakpointObserver = inject(BreakpointObserver);

  customBreakpoints = {
    mobile: '(max-width: 768px)',
    tablet: '(max-width: 1024px)',
    desktop: '(min-width: 1025px)',
    widescreen: '(min-height: 1800px)',
  };

  readonly isMobile = toSignal(
    this.breakpointObserver
      .observe(this.customBreakpoints.mobile)
      .pipe(map((result) => result.matches)),
    { initialValue: false },
  );

  readonly isTablet = toSignal(
    this.breakpointObserver
      .observe(this.customBreakpoints.tablet)
      .pipe(map((result) => result.matches)),
    { initialValue: false },
  );

  readonly isDesktop = toSignal(
    this.breakpointObserver
      .observe(this.customBreakpoints.desktop)
      .pipe(map((result) => result.matches)),
    { initialValue: false },
  );

  readonly isWidescreen = toSignal(
    this.breakpointObserver
      .observe(this.customBreakpoints.widescreen)
      .pipe(map((result) => result.matches)),
    { initialValue: false },
  );
}
