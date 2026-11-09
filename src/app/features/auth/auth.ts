import { AfterViewInit, Component, inject } from '@angular/core';
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
  //to manage intro-animation
  introService = inject(IntroService);

  responsiveService = inject(ResponsiveService);
  isShortHeight = this.responsiveService.isMaxHeight(500);
  isMobile = this.responsiveService.isMobile();

  //only play intro-animation on first visit of website (session)
  ngAfterViewInit(): void {
    const logo = document.querySelector('.main-logo') as HTMLElement;

    if (logo) {
      //gives information about logo-size and -positioning relative to viewport
      const rect = logo.getBoundingClientRect();
      // Calculate how far the logo needs to move to appear centered on screen.
      // translate() moves relative to the element's current position,
      // so we calculate the offset from the logo's actual position to the target center.
      const toX = window.innerWidth / 2 - rect.left - rect.width / 2;
      const toY = window.innerHeight * 0.45 - rect.top - rect.height / 2; //45% screenheight from top of screen

      // Scale factor to reach the target size of 274px(desktop) or 100px(mobile) from the logo's current width.
      const targetWidth = this.isMobile ? 100 : 274;
      const scale = targetWidth / rect.width;

      // Pass values to CSS so the keyframe animation can use them.
      logo.style.setProperty('--intro-x', `${toX}px`);
      logo.style.setProperty('--intro-y', `${toY}px`);
      logo.style.setProperty('--intro-scale', `${scale}`);
    }

    this.introService.startIntro(this.isMobile);

    // Wait for the animation to finish, then clean up.
    // Mobile gets a longer duration to match its 1.2s animation.
    const duration = this.isMobile ? 1200 : 900;
    setTimeout(() => this.introService.finish(), duration);
  }
}
