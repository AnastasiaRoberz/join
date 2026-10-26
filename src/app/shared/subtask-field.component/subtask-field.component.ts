import { Component, computed, inject, input, model, signal } from '@angular/core';
import { ResponsiveService } from '../../services/responsive.service';
import { SubtaskInterface } from '../../interfaces/subtask.interface';
import { TaskService } from '../../services/task.service';

@Component({
  imports: [],
  selector: 'app-subtask-field',
  styleUrl: './subtask-field.component.scss',
  templateUrl: './subtask-field.component.html',
})
export class SubtaskFieldComponent {
  responsiveService = inject(ResponsiveService);
  taskService = inject(TaskService);

  subtasks = model<SubtaskInterface[]>([]);
  sortedSubtasks = computed(() => [...this.subtasks()].sort((a, b) => b.id - a.id));
  taskId = input.required<number>();

  editingSubtaskId = signal<number | null>(null);

  clearInput(input: HTMLInputElement) {
    input.value = '';
  }

  async saveSubtask(input: HTMLInputElement) {
    const rawData = input.value.trim();
    if (!rawData) return;
    const data = {
      title: rawData,
      is_done: false,
      task_id: this.taskId(),
    };
    const newSubtask = await this.taskService.addSubtask(data, this.taskId());
    this.subtasks.update((list) => [...list, newSubtask]);
    input.value = '';
  }

  updateSubtask(input: HTMLInputElement, id: number) {
    const newTitle = input.value.trim();
    if (!newTitle) return;
    this.taskService.updateSubtask(id, this.taskId(), { title: newTitle });
    this.subtasks.update((list) =>
      list.map((item) => (item.id === id ? { ...item, title: newTitle } : item)),
    );
    this.editingSubtaskId.set(null);
  }

  deleteSubtask(id: number) {
    this.taskService.deleteTask(id, 'sub');
    this.subtasks.update((list) => list.filter((item) => item.id !== id));
    this.editingSubtaskId.set(null);
  }

  editSubtask(id: number) {
    this.editingSubtaskId.set(id);
  }
}
