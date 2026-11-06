import { AfterViewInit, Component, inject, signal } from '@angular/core';
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
export class Auth implements AfterViewInit {
  //use navService for login-header only for url: /login
  navService = inject(NavigationService);
  responsiveService = inject(ResponsiveService);
  isShortHeight = this.responsiveService.isMaxHeight(600);

  showIntro = signal(false);
  introDone = signal(false);

  //only play intro-animation on first visit of website (session)
  ngAfterViewInit(): void {
    const forceIntro = new URLSearchParams(window.location.search).has('intro'); //für Test, später entfernen
    const hasVisited = sessionStorage.getItem('intro-shown');
    if (!hasVisited || forceIntro) {
      //forceIntro nach test entfernen
      this.showIntro.set(true);
      setTimeout(() => {
        this.introDone.set(true);
        if (!forceIntro) {
          sessionStorage.setItem('intro-shown', 'true'); //nach test wieder aus if rausnehmen
        }
      }, 1800);
    }
  }
}
