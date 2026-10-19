import { Component, computed, input } from '@angular/core';

// example: <button priority="urgent"></button>

@Component({
  imports: [],
  selector: 'button[priority]', //selector umbenannt, Nutzung über button und Attribut, siehe oben example
  styleUrl: './priority-btn.scss',
  templateUrl: './priority-btn.html',
})
export class PriorityBtn {
  // bei Nutzung Komponente muss einer der folgenden Strings angegeben werden (siehe example):
  priority = input.required<'urgent' | 'medium' | 'low'>();

  //über computed signal wird Inhalt gesetuert + entsprechendes Styling
  preset = computed(() => {
    const presets = {
      urgent: { label: 'Urgent', icon: 'urgent' },
      medium: { label: 'Medium', icon: 'medium' },
      low: { label: 'Low', icon: 'low' },
    };
    return presets[this.priority()];
  });
}
