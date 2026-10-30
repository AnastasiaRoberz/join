import { Directive, HostListener, inject, input, OnDestroy, Renderer2 } from '@angular/core';

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
    this.updatePosition(event);
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

    const offsetX = 12;
    const offsetY = 16;

    this.renderer.setStyle(this.tooltipElement, 'left', `${event.clientX + offsetX}px`);
    this.renderer.setStyle(this.tooltipElement, 'top', `${event.clientY + offsetY}px`);
  }

  /** Removes the tooltip DOM element from `document.body` if it exists. */
  destroyTooltip(): void {
    if (this.tooltipElement) {
      this.renderer.removeChild(document.body, this.tooltipElement);
      this.tooltipElement = undefined;
    }
  }
}
