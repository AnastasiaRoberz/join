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
 * Displays a floating tooltip that follows the mouse cursor while hovering the host element.
 * Automatically suppresses or destroys the tooltip when the bound text is empty (`''`).
 *
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

  renderer = inject(Renderer2);
  hostElement = inject(ElementRef<HTMLElement>).nativeElement;

  /** Text content displayed inside the tooltip; when empty, no tooltip is shown. */
  tooltipText = input.required<string>({ alias: 'appCursorTooltip' });

  /** Reference to the active tooltip DOM node appended to `document.body`. */
  tooltipElement?: HTMLElement;

  // ---------------------------------------------------------------------------
  // Host Event Listeners
  // ---------------------------------------------------------------------------

  /** Creates and positions the tooltip element when the cursor enters the host element. */
  @HostListener('mouseenter', ['$event'])
  onMouseEnter(event: MouseEvent): void {
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
  onMouseMove(event: MouseEvent): void {
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
  onMouseLeave(): void {
    this.destroyTooltip();
  }

  // ---------------------------------------------------------------------------
  // Lifecycle & Helper Methods
  // ---------------------------------------------------------------------------

  /** Cleans up any active tooltip element when the host element is destroyed. */
  ngOnDestroy(): void {
    this.destroyTooltip();
  }

  /** Positions the tooltip at a fixed offset relative to the current viewport cursor coordinates. */
  updatePosition(event: MouseEvent): void {
    if (!this.tooltipElement) return;

    const isMobile = window.innerWidth <= 768;
    const tooltipRect = this.tooltipElement.getBoundingClientRect();
    const padding = 8;

    let left = 0;
    let top = 0;

    if (isMobile) {
      const hostRect = this.hostElement.getBoundingClientRect();
      left = hostRect.left + hostRect.width / 2 - tooltipRect.width / 2;
      top = hostRect.top - tooltipRect.height - 8;

      if (top < padding) {
        top = hostRect.bottom + 8;
      }
    } else {
      left = event.clientX + 12;
      top = event.clientY + 16;
    }

    if (left + tooltipRect.width > window.innerWidth - padding)
      left = window.innerWidth - tooltipRect.width - padding;
    if (left < padding) left = padding;

    this.renderer.setStyle(this.tooltipElement, 'left', `${left}px`);
    this.renderer.setStyle(this.tooltipElement, 'top', `${top}px`);
  }

  /** Removes the tooltip DOM element from `document.body` if it exists. */
  destroyTooltip(): void {
    if (this.tooltipElement) {
      this.renderer.removeChild(document.body, this.tooltipElement);
      this.tooltipElement = undefined;
    }
  }
}
