import { Directive, HostListener, inject, input, Renderer2 } from '@angular/core';

@Directive({
  selector: '[appCursorTooltip]',
  standalone: true,
})
export class CursorTooltipDirective {
  renderer = inject(Renderer2);

  tooltipText = input.required<string>({ alias: 'appCursorTooltip' });
  tooltipElement?: HTMLElement;

  @HostListener('mouseenter', ['\$event'])
  onmouseenter(event: MouseEvent): void {
    if (!this.tooltipText) return;

    this.tooltipElement = this.renderer.createElement('div');
    this.renderer.addClass(this.tooltipElement, 'cursor-tooltip');

    const textNode = this.renderer.createText(this.tooltipText());
    this.renderer.appendChild(this.tooltipElement, textNode);
    this.renderer.appendChild(document.body, this.tooltipElement);

    this.updatePosition(event);
  }

  @HostListener('mousemove', ['\$event'])
  onMouseMove(event: MouseEvent): void {
    this.updatePosition(event);
  }

  @HostListener('mouseleave')
  onMouseLeave(): void {
    this.destroyTooltip();
  }

  updatePosition(event: MouseEvent): void {
    if (!this.tooltipElement) return;

    const offsetX = 12;
    const offsetY = 16;

    this.renderer.setStyle(this.tooltipElement, 'left', `${event.clientX + offsetX}px`);
    this.renderer.setStyle(this.tooltipElement, 'top', `${event.clientY + offsetY}px`);
  }

  destroyTooltip(): void {
    if (this.tooltipElement) {
      this.renderer.removeChild(document.body, this.tooltipElement);
      this.tooltipElement = undefined;
    }
  }

  ngOnDestroy(): void {
    this.destroyTooltip();
  }
}
