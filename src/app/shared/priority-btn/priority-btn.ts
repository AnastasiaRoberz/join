import { Component, computed, input } from '@angular/core';

// example: <button priority="urgent"></button>

@Component({
  imports: [],
  selector: 'button[priority]',
  styleUrl: './priority-btn.scss',
  templateUrl: './priority-btn.html',
})
export class PriorityBtn {
  priority = input.required<'urgent' | 'medium' | 'low'>();

  preset = computed(() => {
    const presets = {
      urgent: { label: 'Urgent', icon: 'urgent' },
      medium: { label: 'Medium', icon: 'medium' },
      low: { label: 'Low', icon: 'low' },
    };
    return presets[this.priority()];
  });
}
