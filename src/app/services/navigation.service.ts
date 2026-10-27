import { Location } from '@angular/common';
import { inject, Service, signal } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { filter } from 'rxjs';

/**
 * Small helper around the Angular {@link Router} and {@link Location} for navigation state
 * and "back" navigation.
 *
 * @example
 * nav = inject(NavigationService);
 * // template: <button (click)="nav.goBack()">Back</button>
 * // active route check: nav.currentUrl().startsWith('/contacts')
 */
@Service()
export class NavigationService {
  /** Angular Location service, used for browser history navigation. */
  location = inject(Location);
  /** Angular Router, used for the fallback navigation and to listen to route changes. */
  router = inject(Router);

  /** Current URL of the app (after redirects). Initialized with the router URL and updated on every `NavigationEnd`. */
  currentUrl = signal<string>(this.router.url);

  /** Subscribes to router events to keep `currentUrl` in sync (lives as long as the root service). */
  constructor() {
    this.router.events
      .pipe(filter((event): event is NavigationEnd => event instanceof NavigationEnd))
      .subscribe((event) => {
        this.currentUrl.set(event.urlAfterRedirects);
      });
  }

  /**
   * Navigates one step back in the browser history. If the history has no previous entry,
   * navigates to `/summary` instead so the user never ends up on a dead end.
   */
  goBack(): void {
    if (window.history.length > 1) {
      this.location.back();
    } else {
      this.router.navigate(['/summary']);
    }
  }
}
