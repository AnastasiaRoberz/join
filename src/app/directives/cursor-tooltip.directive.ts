import {
  Directive,
  ElementRef,
  HostListener,
  inject,
  input,
  OnDestroy,
  Renderer2,
} from '@angular/core';

/**
 * Displays a floating tooltip while hovering the host element.
 * - Desktop (> 768px): the tooltip follows the mouse cursor.
 * - Mobile (<= 768px): the tooltip is centered above the host element (below it if there is no room above).
 *
 * Automatically suppresses or destroys the tooltip when the bound text is empty (`''`).
 * Styled globally via the `.cursor-tooltip` class in `src/styles.scss`.
 */
@Directive({
  selector: '[appCursorTooltip]',
  standalone: true,
})
export class CursorTooltipDirective implements OnDestroy {
  // ---------------------------------------------------------------------------
  // Injected Dependencies & State
  // ---------------------------------------------------------------------------

  private readonly renderer = inject(Renderer2);
  private readonly hostElement = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;

  /** Text content displayed inside the tooltip; when empty, no tooltip is shown. */
  public readonly tooltipText = input.required<string>({ alias: 'appCursorTooltip' });

  /** Reference to the active tooltip DOM node appended to `document.body`. */
  private tooltipElement?: HTMLElement;

  // ---------------------------------------------------------------------------
  // Host Event Listeners
  // ---------------------------------------------------------------------------

  /** Creates and positions the tooltip element when the cursor enters the host element. */
  @HostListener('mouseenter', ['$event'])
  public onMouseEnter(event: MouseEvent): void {
    if (!this.tooltipText()) return;

    this.tooltipElement = this.renderer.createElement('div');
    this.renderer.addClass(this.tooltipElement, 'cursor-tooltip');

    const textNode = this.renderer.createText(this.tooltipText());
    this.renderer.appendChild(this.tooltipElement, textNode);
    this.renderer.appendChild(document.body, this.tooltipElement);

    this.updatePosition(event);
  }

  /** Updates the tooltip position as the cursor moves, or destroys it if the text became empty. */
  @HostListener('mousemove', ['$event'])
  public onMouseMove(event: MouseEvent): void {
    if (!this.tooltipText()) {
      this.destroyTooltip();
      return;
    }
    if (window.innerWidth > 768) {
      this.updatePosition(event);
    }
  }

  /** Removes the tooltip when the cursor leaves the host element. */
  @HostListener('mouseleave')
  public onMouseLeave(): void {
    this.destroyTooltip();
  }

  // ---------------------------------------------------------------------------
  // Lifecycle & Helper Methods
  // ---------------------------------------------------------------------------

  /** Cleans up any active tooltip element when the host element is destroyed. */
  public ngOnDestroy(): void {
    this.destroyTooltip();
  }

  /**
   * Positions the tooltip: relative to the cursor on desktop, relative to the host element on mobile.
   * The tooltip never leaves the viewport horizontally.
   *
   * @param event - The mouse event providing the viewport cursor coordinates.
   */
  private updatePosition(event: MouseEvent): void {
    if (!this.tooltipElement) return;

    const padding = 8;
    const tooltipRect = this.tooltipElement.getBoundingClientRect();
    const isMobile = window.innerWidth <= 768;
    const position = isMobile
      ? this.getMobilePosition(tooltipRect, padding)
      : this.getDesktopPosition(event);
    const left = this.clampHorizontal(position.left, tooltipRect.width, padding);

    this.renderer.setStyle(this.tooltipElement, 'left', `${left}px`);
    this.renderer.setStyle(this.tooltipElement, 'top', `${position.top}px`);
  }

  /**
   * Centers the tooltip above the host element, or below it if there is no room above.
   *
   * @param tooltipRect - Bounding box of the tooltip.
   * @param padding - Minimum distance to the viewport edge.
   * @returns Unclamped `left` and `top` position in px.
   */
  private getMobilePosition(
    tooltipRect: DOMRect,
    padding: number,
  ): { left: number; top: number } {
    const hostRect = this.hostElement.getBoundingClientRect();
    const left = hostRect.left + hostRect.width / 2 - tooltipRect.width / 2;
    const top = hostRect.top - tooltipRect.height - 8;
    return { left, top: top < padding ? hostRect.bottom + 8 : top };
  }

  /**
   * Places the tooltip at a fixed offset next to the cursor.
   *
   * @param event - The mouse event providing the viewport cursor coordinates.
   * @returns Unclamped `left` and `top` position in px.
   */
  private getDesktopPosition(event: MouseEvent): { left: number; top: number } {
    return { left: event.clientX + 12, top: event.clientY + 16 };
  }

  /**
   * Keeps the tooltip inside the viewport horizontally.
   *
   * @param left - Desired left position in px.
   * @param width - Width of the tooltip in px.
   * @param padding - Minimum distance to the viewport edge.
   * @returns The corrected left position in px.
   */
  private clampHorizontal(left: number, width: number, padding: number): number {
    let clamped = left;
    if (clamped + width > window.innerWidth - padding) {
      clamped = window.innerWidth - width - padding;
    }
    return clamped < padding ? padding : clamped;
  }

  /** Removes the tooltip DOM element from `document.body` if it exists. */
  private destroyTooltip(): void {
    if (this.tooltipElement) {
      this.renderer.removeChild(document.body, this.tooltipElement);
      this.tooltipElement = undefined;
    }
  }
}
