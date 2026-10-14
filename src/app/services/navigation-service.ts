import { Location } from '@angular/common';
import { inject, Service, signal } from '@angular/core';
import { Router } from '@angular/router';

@Service()
export class NavigationService {
  location = inject(Location);
  router = inject(Router);

  goBack(): void {
    if (window.history.length > 1) {
      this.location.back();
    } else {
      this.router.navigate(['/summary']);
    }
  }

  getCurrentUrl(): string {
    console.log(this.router.url);
    return this.router.url;
  }
}
