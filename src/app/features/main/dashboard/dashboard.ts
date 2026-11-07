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

  // The page itself (the scroll area next to sidebar/header) and the greeting box
  private host = inject<ElementRef<HTMLElement>>(ElementRef);
  private welcome = viewChild<ElementRef<HTMLElement>>('welcome');

  constructor() {
    // Start BEFORE the first render, so the dashboard never flashes up
    // for a moment without the overlay.
    this.greeterService.startGreeting();
  }

  // Only needed for the "fly" variant: calculate how far the greeting is
  // from the centre of the page, so it can start there.
  ngAfterViewInit(): void {
    const welcome = this.welcome()?.nativeElement;
    if (!this.greeterService.isGreeting() || !welcome || this.isShortHeight()) return;

    // Greeting box in its final spot (grid cell / above the tiles) ...
    const rect = welcome.getBoundingClientRect();
    // ... and the visible page area (without sidebar and header)
    const area = this.host.nativeElement.getBoundingClientRect();

    // Target = middle of the visible page
    const centerX = area.left + area.width / 2;
    const centerY = (Math.max(area.top, 0) + window.innerHeight) / 2;

    const toX = centerX - (rect.left + rect.width / 2);
    const toY = centerY - (rect.top + rect.height / 2);

    // Start position as a string, e.g. "translate(-350px, -80px)"
    const center = `translate(${toX}px, ${toY}px)`; // ← this line

    // the numbers go straight into the animation, so it can't start before they exist.
    // Timing matches .greeter-overlay: 0.2s delay, 1.8s total, hold until 50%, ease-in-out.
    welcome.animate(
      [
        { transform: center }, // 0%: centre
        { transform: center, offset: 0.5, easing: 'ease-in-out' }, // 50%: still centre, then slide
        { transform: 'translate(0, 0)' }, // 100%: its spot
      ],
      { duration: 1800, delay: 200, fill: 'backwards' }, // backwards: stay in the centre during the delay
    );
  }
}
