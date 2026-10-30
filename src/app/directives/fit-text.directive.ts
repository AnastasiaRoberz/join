import {
  AfterViewInit,
  Directive,
  ElementRef,
  HostListener,
  Input,
  OnChanges,
  OnDestroy,
} from '@angular/core';

@Directive({
  selector: '[appFitText]',
  standalone: true,
})
export class FitTextDirective implements AfterViewInit, OnChanges, OnDestroy {
  @Input() maxSize: number = 61;
  @Input() minSize: number = 20;
  @Input() container?: HTMLElement | 'parent';

  private observer?: MutationObserver;

  constructor(private element: ElementRef<HTMLElement>) {}

  ngAfterViewInit(): void {
    requestAnimationFrame(() => this.fit());

    this.observer = new MutationObserver(() => this.fit());

    this.observer.observe(this.element.nativeElement, {
      childList: true,
      characterData: true,
      subtree: true,
    });
  }

  ngOnChanges(): void {
    this.fit();
  }

  ngOnDestroy(): void {
    this.observer?.disconnect();
  }

  @HostListener('window:resize')
  fit() {
    const element = this.element.nativeElement;
    const target = this.container === 'parent' ? element.parentElement : (this.container ?? null);
    let size = this.maxSize;
    element.style.fontSize = `${size}px`;

    const isOverflowing = () => {
      const selfOverflow =
        element.scrollHeight - element.clientHeight > 1 ||
        element.scrollWidth - element.clientWidth > 1;

      if (target) {
        const targetOverflow =
          target.scrollHeight - target.clientHeight > 1 ||
          target.scrollWidth - target.clientWidth > 1;
        return selfOverflow || targetOverflow;
      }

      return selfOverflow;
    };

    while (isOverflowing() && size > this.minSize) {
      size -= 1;
      element.style.fontSize = `${size}px`;
    }
  }
}
