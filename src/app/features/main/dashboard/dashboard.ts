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

    // translate() moves relative to its own position: offset = centre of area - centre of greeting
    const toX = area.left + area.width / 2 - (rect.left + rect.width / 2);
    const toY = area.top + area.height / 2 - (rect.top + rect.height / 2);

    // Pass values to CSS so the keyframe animation can use them.
    welcome.style.setProperty('--greeter-x', `${toX}px`);
    welcome.style.setProperty('--greeter-y', `${toY}px`);
  }
}
