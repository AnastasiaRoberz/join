import { Component, computed, inject, model, signal } from '@angular/core';
import { ResponsiveService } from '../../services/responsive.service';
import { SubtaskInterface } from '../../interfaces/subtask.interface';
import { Buttons } from '../button.component/button.component';

@Component({
  imports: [Buttons],
  selector: 'app-subtask-field',
  styleUrl: './subtask-field.component.scss',
  templateUrl: './subtask-field.component.html',
})
export class SubtaskFieldComponent {
  responsiveService = inject(ResponsiveService);

  subtasks = model<SubtaskInterface[]>([]);
  sortedSubtasks = computed(() => [...this.subtasks()].sort((a, b) => b.id - a.id));

  editingSubtaskId = signal<number | null>(null);

  clearInput(input: HTMLInputElement) {
    input.value = '';
  }

  saveSubtask(input: HTMLInputElement) {
    const rawData = input.value.trim();
    if (!rawData) return;

    const newSubtask: SubtaskInterface = {
      id: Date.now(),
      title: rawData,
      is_done: false,
    };
    this.subtasks.update((list) => [newSubtask, ...list]);
    input.value = '';
  }

  updateSubtaskTitle(input: HTMLInputElement, id: number) {
    const newTitle = input.value.trim();
    if (!newTitle) return;

    this.subtasks.update((list) =>
      list.map((item) => (item.id === id ? { ...item, title: newTitle } : item)),
    );
    this.editingSubtaskId.set(null);
  }

  deleteSubtask(id: number) {
    this.subtasks.update((list) => list.filter((item) => item.id !== id));
    this.editingSubtaskId.set(null);
  }

  editSubtask(id: number) {
    this.editingSubtaskId.set(id);
  }
}
