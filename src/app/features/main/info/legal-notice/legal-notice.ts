import { Location } from '@angular/common';
import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  imports: [],
  selector: 'app-legal-notice',
  styleUrl: './legal-notice.scss',
  templateUrl: './legal-notice.html',
})
export class LegalNotice {
  location = inject(Location);
  router = inject(Router);

  goBack(): void {
    if (window.history.length > 1) {
      this.location.back();
    } else {
      this.router.navigate(['/summary']);
    }
  }
}
