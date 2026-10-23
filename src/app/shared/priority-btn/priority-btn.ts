import { Component, computed, HostBinding, HostListener, input, output } from '@angular/core';

// example: <button priority="urgent"></button>

export type Priority = 'urgent' | 'medium' | 'low';

@Component({
  imports: [],
  selector: 'button[priority]', //selector umbenannt, Nutzung über button und Attribut, siehe oben example
  styleUrl: './priority-btn.scss',
  templateUrl: './priority-btn.html',
})
export class PriorityBtn {
  // bei Nutzung Komponente muss einer der folgenden Strings angegeben werden (siehe example):
  priority = input.required<Priority>();

  isActive = input<boolean>(false);

  prioSelected = output<Priority>();

  // HostBinding: fügt dem Host-Element (<button>) die CSS-Klasse 'active' hinzu
  // wenn isActive() === true
  @HostBinding('class.active')
  get activeClass() {
    return this.isActive();
  }

  //über computed signal wird Inhalt gesetuert + entsprechendes Styling
  preset = computed(() => {
    const presets = {
      urgent: { label: 'Urgent', icon: 'urgent' },
      medium: { label: 'Medium', icon: 'medium' },
      low: { label: 'Low', icon: 'low' },
    };
    return presets[this.priority()];
  });

  @HostListener('click')
  onClick(): void {
    this.prioSelected.emit(this.priority());
  }
}
