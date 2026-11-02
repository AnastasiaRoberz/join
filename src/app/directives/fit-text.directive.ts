import { AfterViewInit, Directive, ElementRef, HostListener, Input } from '@angular/core';

@Directive({
  selector: '[appFitText]',
  standalone: true,
})
export class FitTextDirective implements AfterViewInit {
  @Input() maxSize: number = 61;
  @Input() minSize: number = 20;

  constructor(private element: ElementRef<HTMLElement>) {}

  ngAfterViewInit(): void {
    requestAnimationFrame(() => this.fit());
  }

  @HostListener('window:resize')
  fit() {
    const element = this.element.nativeElement;
    let size = this.maxSize;
    element.style.fontSize = `${size}px`;

    const isOverflowing = () =>
      element.scrollHeight - element.clientHeight > 1 || element.scrollWidth > element.clientWidth;
    while (isOverflowing() && size > this.minSize) {
      size -= 1;
      element.style.fontSize = `${size}px`;
    }
  }
}
