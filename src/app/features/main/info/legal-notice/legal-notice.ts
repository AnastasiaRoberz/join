import { Component, inject } from '@angular/core';
import { NavigationService } from '../../../../services/navigation.service';

@Component({
  imports: [],
  selector: 'app-legal-notice',
  styleUrl: './legal-notice.scss',
  templateUrl: './legal-notice.html',
})
export class LegalNotice {
  navService = inject(NavigationService);
}
