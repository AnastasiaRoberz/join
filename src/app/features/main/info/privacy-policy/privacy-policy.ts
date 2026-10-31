import { Component, inject } from '@angular/core';
import { NavigationService } from '../../../../services/navigation.service';

@Component({
  imports: [],
  selector: 'app-privacy-policy',
  styleUrl: './privacy-policy.scss',
  templateUrl: './privacy-policy.html',
  host: {
    class: 'scroll-container',
  },
})
export class PrivacyPolicy {
  navService = inject(NavigationService);
}
