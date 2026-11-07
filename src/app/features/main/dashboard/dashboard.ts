import { AfterViewInit, Component, ElementRef, inject, viewChild } from '@angular/core';
import { ResponsiveService } from '../../../services/responsive.service';
import { IntroService } from '../../../services/intro.service';

@Component({
  imports: [],
  selector: 'app-dashboard',
  styleUrl: './dashboard.scss',
  templateUrl: './dashboard.html',
})
export class Dashboard implements AfterViewInit {
  responsiveService = inject(ResponsiveService);
  isShortHeight = this.responsiveService.isMaxHeight(768);

  //to manage intro-animation
  greeterService = inject(IntroService);

  // Reference to <app-dashboard>
  private host = inject<ElementRef<HTMLElement>>(ElementRef);
  // Reference to the greeting box in the template <div #welcome>
  private welcome = viewChild<ElementRef<HTMLElement>>('welcome');

  constructor() {
    // Checks whether a greeting is waiting (after login) and switches it on.
    this.greeterService.startGreeting();
  }

  //
  // Only needed for the "fly" variant: calculate how far the greeting is
  // from the centre of the page, so it can start there.
  ngAfterViewInit(): void {
    const welcome = this.welcome()?.nativeElement;
    if (!this.greeterService.isGreeting() || !welcome || this.isShortHeight()) return;

    // Hide the greeting until the web font has loaded: with the fallback font the text
    // has a different size, so measuring now would give a slightly wrong centre.
    welcome.style.visibility = 'hidden';
    document.fonts.ready.then(() => this.playFly(welcome));
  }

  // Measures the greeting and lets it fly from the centre to its spot
  private playFly(welcome: HTMLElement): void {
    // Greeting box in its final spot (grid cell / above the tiles)
    const rect = welcome.getBoundingClientRect();
    // The page area (right of the sidebar, under the header)
    const area = this.host.nativeElement.getBoundingClientRect();

    // Horizontal target: middle of the visible page area (right of the sidebar, never past the screen edge)
    const left = Math.max(area.left, 0);
    const right = Math.min(area.right, window.innerWidth);
    const centerX = (left + right) / 2;
    // Vertical target: middle of the whole screen
    const centerY = window.innerHeight / 2;

    // How far the greeting's middle has to move to sit on the target
    const toX = centerX - (rect.left + rect.width / 2);
    const toY = centerY - (rect.top + rect.height / 2);

    // Start position as a CSS transform, e.g. "translate(-350px, -80px)"
    const center = `translate(${toX}px, ${toY}px)`;

    const animation = welcome.animate(
      [
        { transform: center }, // start: middle of the screen
        { transform: center, offset: 0.5, easing: 'ease-in-out' }, // halfway: still in the middle, then slide
        { transform: 'translate(0, 0)' }, // end: its spot
      ],
      { duration: 1800, delay: 200, fill: 'backwards' }, // same timing as .greeter-overlay
    );

    // Waiting for the font may take a few ms: start the greeting at the same moment
    // as the overlay, so both stay in sync.
    const overlayAnimation = this.host.nativeElement
      .querySelector('.greeter-overlay')
      ?.getAnimations()[0];
    if (overlayAnimation) animation.startTime = overlayAnimation.startTime;

    welcome.style.visibility = ''; // show it again, now already in the middle
  }
}
