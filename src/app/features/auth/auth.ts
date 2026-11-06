import { AfterViewInit, Component, inject, signal } from '@angular/core';
import { RouterOutlet, RouterLinkWithHref } from '@angular/router';
import { Footer } from '../../layout/footer/footer';
import { NavigationService } from '../../services/navigation.service';
import { Buttons } from '../../shared/button.component/button.component';
import { ResponsiveService } from '../../services/responsive.service';
import { IntroService } from '../../services/intro.service';

@Component({
  imports: [RouterOutlet, Footer, Buttons, RouterLinkWithHref],
  selector: 'app-auth',
  styleUrl: './auth.scss',
  templateUrl: './auth.html',
})
export class Auth implements AfterViewInit {
  //use navService for login-header only for url: /login
  navService = inject(NavigationService);
  responsiveService = inject(ResponsiveService);
  introService = inject(IntroService);
  isShortHeight = this.responsiveService.isMaxHeight(600);

  //only play intro-animation on first visit of website (session)
  ngAfterViewInit(): void {
    const isMobile = this.responsiveService.isMobile();

    const logo = document.querySelector('.main-logo') as HTMLElement;
    if (logo) {
      const rect = logo.getBoundingClientRect();
      const toX = window.innerWidth / 2 - rect.left - rect.width / 2;
      const toY = window.innerHeight * 0.4 - rect.top - rect.height / 2;
      const scale = 274 / rect.width;

      logo.style.setProperty('--intro-x', `${toX}px`);
      logo.style.setProperty('--intro-y', `${toY}px`);
      logo.style.setProperty('--intro-scale', `${scale}`);
    }

    this.introService.startIfNeeded(isMobile);

    const duration = isMobile ? 1200 : 900;
    setTimeout(() => this.introService.finish(), duration);
  }
}
