import { Component, inject } from '@angular/core';
import { NavigationService } from '../../../../services/navigation.service';

@Component({
  imports: [],
  selector: 'app-help',
  styleUrl: './help.scss',
  templateUrl: './help.html',
})
export class Help {
  navService = inject(NavigationService);
}
