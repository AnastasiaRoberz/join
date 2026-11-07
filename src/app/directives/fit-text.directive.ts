import { AfterViewInit, Directive, ElementRef, HostListener, input, Input } from '@angular/core';

@Directive({
  selector: '[appFitText]',
  standalone: true,
})
export class FitTextDirective implements AfterViewInit {
  @Input() maxSize: number = 61;
  @Input() minSize: number = 20;
  @Input() fitParent: boolean = false;

  private mutationObserver?: MutationObserver;

  constructor(private element: ElementRef<HTMLElement>) {}

  ngAfterViewInit(): void {
    requestAnimationFrame(() => this.fit());

    this.mutationObserver = new MutationObserver(() => this.fit());
    this.mutationObserver.observe(this.element.nativeElement, {
      childList: true,
      characterData: true,
      subtree: true,
    });
  }

  ngOnDestroy(): void {
    this.mutationObserver?.disconnect();
  }

  @HostListener('window:resize')
  fit() {
    const element = this.element.nativeElement;
    const parent = element.parentElement;
    element.style.fontSize = '';

    const currentFontSize = parseFloat(window.getComputedStyle(element).fontSize) || this.maxSize;

    let size = Math.floor(currentFontSize);
    element.style.fontSize = `${size}px`;

    const isOverflowing = () => {
      const selfOverflow =
        element.scrollHeight - element.clientHeight > 1 ||
        element.scrollWidth > element.clientWidth;

      const parentOverflow =
        this.fitParent && parent
          ? parent.scrollHeight - parent.clientHeight > 1 || parent.scrollWidth > parent.clientWidth
          : false;

      return selfOverflow || parentOverflow;
    };

    while (isOverflowing() && size > this.minSize) {
      size -= 1;
      element.style.fontSize = `${size}px`;
    }
  }
}
