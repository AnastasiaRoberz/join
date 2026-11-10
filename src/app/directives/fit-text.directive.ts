import {
  AfterViewInit,
  Directive,
  ElementRef,
  HostListener,
  inject,
  Input,
  OnDestroy,
} from '@angular/core';

/**
 * Shrinks the font size of the host element until its text no longer overflows.
 * The size is re-fitted on window resize and whenever the content of the host changes.
 *
 * @example
 * <h2 appFitText [maxSize]="40" [minSize]="16">{{ title }}</h2>
 */
@Directive({
  selector: '[appFitText]',
  standalone: true,
})
export class FitTextDirective implements AfterViewInit, OnDestroy {
  /** Fallback font size in px if the computed size cannot be read. */
  @Input() public maxSize: number = 61;
  /** Smallest font size in px the text is shrunk to. */
  @Input() public minSize: number = 20;
  /** Whether an overflow of the parent element also counts as overflow. */
  @Input() public fitParent: boolean = false;

  /** Reference to the host DOM element whose text size is being dynamically adjusted. */
  private readonly element = inject<ElementRef<HTMLElement>>(ElementRef);
  /** MutationObserver watching text content changes to re-trigger size fitting. */
  private mutationObserver?: MutationObserver;

  /** Fits the text once after rendering and observes content changes of the host. */
  public ngAfterViewInit(): void {
    requestAnimationFrame(() => this.fit());

    this.mutationObserver = new MutationObserver(() => this.fit());
    this.mutationObserver.observe(this.element.nativeElement, {
      childList: true,
      characterData: true,
      subtree: true,
    });
  }

  /** Stops observing content changes. */
  public ngOnDestroy(): void {
    this.mutationObserver?.disconnect();
  }

  /** Resets the font size and shrinks it step by step (1px) until nothing overflows or `minSize` is reached. */
  @HostListener('window:resize')
  public fit(): void {
    const element = this.element.nativeElement;
    const parent = element.parentElement;
    element.style.fontSize = '';

    const currentFontSize = parseFloat(window.getComputedStyle(element).fontSize) || this.maxSize;

    let size = Math.floor(currentFontSize);
    element.style.fontSize = `${size}px`;

    while (this.isElementOverflowing(element, parent) && size > this.minSize) {
      size -= 1;
      element.style.fontSize = `${size}px`;
    }
  }

  /**
   * Checks whether the element (or, with `fitParent`, its parent) is bigger than its box.
   *
   * @param element - The host element.
   * @param parent - The parent element of the host, if any.
   */
  private isElementOverflowing(element: HTMLElement, parent: HTMLElement | null): boolean {
    const selfOverflow =
      element.scrollHeight - element.clientHeight > 1 || element.scrollWidth > element.clientWidth;

    const parentOverflow =
      this.fitParent && parent
        ? parent.scrollHeight - parent.clientHeight > 1 || parent.scrollWidth > parent.clientWidth
        : false;

    return selfOverflow || parentOverflow;
  }
}
