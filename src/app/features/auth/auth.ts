import { AfterViewInit, Component, inject } from '@angular/core';
import { RouterOutlet, RouterLinkWithHref } from '@angular/router';
import { Footer } from '../../layout/footer/footer';
import { NavigationService } from '../../services/navigation.service';
import { Buttons } from '../../shared/button.component/button.component';
import { ResponsiveService } from '../../services/responsive.service';
import { IntroService } from '../../services/intro.service';

/**
 * Authentication layout shell hosting login and registration views with intro logo animation.
 */
@Component({
  imports: [RouterOutlet, Footer, Buttons, RouterLinkWithHref],
  selector: 'app-auth',
  styleUrl: './auth.scss',
  templateUrl: './auth.html',
})
export class Auth implements AfterViewInit {
  /** Navigation service for current route checks. */
  protected readonly navService = inject(NavigationService);

  /** Intro service managing startup animation overlay state. */
  protected readonly introService = inject(IntroService);

  /** Responsive service for viewport layout adaptation. */
  protected readonly responsiveService = inject(ResponsiveService);

  /** Signal indicating viewports with height <= 500px. */
  protected readonly isShortHeight = this.responsiveService.isMaxHeight(500);

  /** Snapshot of mobile viewport state at component initialization. */
  private readonly isMobile = this.responsiveService.isMobile();

  /** Plays intro animation on initial session visit. */
  public ngAfterViewInit(): void {
    const logo = document.querySelector('.main-logo') as HTMLElement;
    if (logo) {
      this.configureLogoIntroStyles(logo);
    }

    this.introService.startIntro(this.isMobile);
    const duration = this.isMobile ? 1200 : 900;
    setTimeout(() => this.introService.finish(), duration);
  }

  /**
   * Configures CSS custom properties on the logo element for the entry keyframe animation.
   *
   * @param logo - The DOM element of the main logo.
   */
  private configureLogoIntroStyles(logo: HTMLElement): void {
    const rect = logo.getBoundingClientRect();
    const toX = window.innerWidth / 2 - rect.left - rect.width / 2;
    const toY = window.innerHeight * 0.45 - rect.top - rect.height / 2;
    const targetWidth = this.isMobile ? 100 : 274;
    const scale = targetWidth / rect.width;

    logo.style.setProperty('--intro-x', `${toX}px`);
    logo.style.setProperty('--intro-y', `${toY}px`);
    logo.style.setProperty('--intro-scale', `${scale}`);
  }
}
