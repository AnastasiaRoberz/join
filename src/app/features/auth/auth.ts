import { Component, inject } from '@angular/core';
import { RouterOutlet, RouterLinkWithHref } from '@angular/router';
import { Footer } from '../../layout/footer/footer';
import { NavigationService } from '../../services/navigation.service';
import { Buttons } from '../../shared/button.component/button.component';
import { ResponsiveService } from '../../services/responsive.service';

@Component({
  imports: [RouterOutlet, Footer, Buttons, RouterLinkWithHref],
  selector: 'app-auth',
  styleUrl: './auth.scss',
  templateUrl: './auth.html',
})
export class Auth {
  //use navService for login-header only for url: /login
  navService = inject(NavigationService);

  responsiveService = inject(ResponsiveService);
}
