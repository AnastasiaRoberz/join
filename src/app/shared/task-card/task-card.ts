import { Component, computed, inject, input } from '@angular/core';
import { Task } from '../../interfaces/task';
import { SupabaseService } from '../../services/supabase';
import { UserAvatar } from '../user-avatar/user-avatar';

/**
 * Shows one task as a card on the board: category, title, description preview,
 * subtask progress, assigned users and priority.
 *
 * Presentational component: it only displays the task it receives.
 *
 * @example
 * <app-task-card [task]="task" />
 */
@Component({
  imports: [UserAvatar],
  selector: 'app-task-card',
  styleUrl: 'task-card.scss',
  templateUrl: 'task-card.html',
})
export class TaskCard {
  supabase = inject(SupabaseService);

  /** The task that is displayed. Must be provided by the parent. */
  task = input.required<Task>();

  /** Number of subtasks that are already checked. */
  doneSubtasks = computed(() => this.task().subtasks.filter((subtask) => subtask.done).length);

  /** Progress of the subtasks in percent (0 if there are no subtasks). */
  progress = computed(() => {
    const total = this.task().subtasks.length;
    return total ? (this.doneSubtasks() / total) * 100 : 0;
  });

  /** Contacts whose id is listed in `assigned_to` of the task. */
  assignedUsers = computed(() => {
    const ids = this.task().assigned_to;
    return this.supabase.contacts().filter((contact) => ids.some((id) => id === contact.id));
  });
}