import { computed, inject, Service, signal } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { TaskInterface } from '../interfaces/task.interface';
import { SubtaskInterface } from '../interfaces/subtask.interface';

/**
 * Domain service managing tasks, subtasks, and user assignments.
 * Acts as the single source of truth for task state within the application using Angular Signals.
 */
@Service()
export class TaskService {
  supabaseService = inject(SupabaseService);
  tasks = signal<TaskInterface[]>([]);

  /**
   * Automatically fetches all tasks from Supabase upon service instantiation.
   */
  constructor() {
    this.getAllTasks();
  }

  /**
   * Queries all tasks from the `tasks` table with deep PostgREST joins:
   * - 1:N join on `subtasks`
   * - N:M join across `task-assignment` pulling related `contacts`
   *
   * Flattens the nested assignment structure into `assigned_users` and updates the `tasks` signal.
   *
   * @returns A promise that resolves once the local signal has been synchronized with the database
   */
  async getAllTasks(): Promise<void> {
    const taskData = await this.supabaseService.getData(
      'tasks',
      '*, subtasks(*), task-assignment(contacts(id, firstname, surname, badge_color))',
    );
    if (!taskData) return;

    const mappedTasks = taskData.map((task: any) => ({
      ...task,
      subtasks: task.subtasks ?? [],
      assigned_users: task['task-assignment']
        ? task['task-assignment'].map((a: any) => a.contacts)
        : [],
    })) as TaskInterface[];
    this.tasks.set(mappedTasks);
  }

  /**
   * Fetches a single task by ID along with its subtasks and assigned users.
   *
   * @param id - The ID of the target task
   * @returns A promise resolving to the structured `TaskInterface` entity, or `null` if not found
   */
  async getOneTask(id: number): Promise<TaskInterface | null> {
    const task = await this.supabaseService.getOneItem(
      'tasks',
      id,
      '*, subtasks(*), task-assignment(contacts(id, firstname, surname, badge_color))',
    );

    if (!task) return null;

    const completeTask = {
      ...task,
      subtasks: task.subtasks ?? [],
      assigned_users: task['task-assignment']
        ? task['task-assignment'].map((a: any) => a.contacts)
        : [],
    } as TaskInterface;
    return completeTask;
  }

  sortedTasks = computed(() => {
    return [...this.tasks()].sort((a, b) => a.title.localeCompare(b.title));
  });

  /**
   * Inserts a new task entity into the database and triggers a full reload to establish
   * clean relational joins.
   * Returns the new task's ID so the caller can create related records (e.g. task-assignment).
   *
   * @param taskData - The task data payload without `id`, `assigned_users` and `subtasks`,
   *                   as these are managed separately via join tables
   * @returns A promise resolving to the newly created task's `id`, or `null` on failure
   */
  async addTask(taskData: Omit<TaskInterface, 'id'>): Promise<void> {
    const newTask = await this.supabaseService.addData(taskData, 'tasks');
    if (newTask) {
      await this.getAllTasks();
    }
  }

  /**
   * Updates an existing task in the database and applies optimistic in-place updates
   * to the local `tasks` signal without triggering a network re-fetch.
   * Preserves existing subtasks and assigned user arrays if not provided in `taskData`.
   *
   * @param taskData - The updated task entity including its unique `id`
   * @returns A promise that resolves after the remote update and local signal modification
   */
  async updateTask(id: number, taskData: Partial<TaskInterface>): Promise<void> {
    const success = await this.supabaseService.updateData(id, taskData, 'tasks');

    if (success) {
      this.tasks.update((list) =>
        list.map((task) =>
          task.id === id
            ? {
                ...task,
                ...taskData,
                subtasks: taskData.subtasks ?? task.subtasks,
                assigned_users: taskData.assigned_users ?? task.assigned_users,
              }
            : task,
        ),
      );
    }
  }

  async updateSubtaskStatus(subtaskId: number, isDone: boolean): Promise<void> {
    const success = await this.supabaseService.updateData(
      subtaskId,
      { is_done: isDone },
      'subtasks',
    );

    if (success) {
      this.tasks.update((list) =>
        list.map((task) => ({
          ...task,
          subtasks: task.subtasks?.map((subtask) =>
            subtask.id === subtaskId ? { ...subtask, is_done: isDone } : subtask,
          ),
        })),
      );
    }
  }

  /**
   * Deletes either a main task or a subtask, updating the local signal state selectively.
   *
   * @param id - The ID of the item to delete
   * @param task - Scope indicator:
   *  - `'main'`: deletes the task from `tasks` and removes it from the top-level list
   *  - `'sub'`: deletes the entry from `subtasks` and filters it out of its parent's `subtasks` array
   * @returns A promise resolving after deletion and state synchronization
   */
  async deleteTask(id: number) {
    const success = await this.supabaseService.deleteData(id, 'tasks');

    if (success) {
      this.tasks.update((list) => list.filter((task) => task.id !== id));
    }
  }

  async setTaskSubtasks(taskId: number, subtasks: Omit<SubtaskInterface, 'id'>[]): Promise<void> {
    await this.supabaseService.deleteTaskSubtasks(taskId);
    if (subtasks.length > 0) {
      const data = [...subtasks].reverse().map((s) => ({
        title: s.title,
        is_done: s.is_done ?? false,
        task_id: taskId,
      }));
      await this.supabaseService.addData(data, 'subtasks');
    }
    await this.getAllTasks();
  }

  /**
   * Links a contact to a task by creating an entry in the `task-assignment` join table.
   * Refreshes the task list to reflect the updated assignments across the UI.
   *
   * @param taskId - The target task ID
   * @param userId - The contact ID to assign
   * @returns A promise that resolves after the assignment is persisted and tasks are reloaded
   */
  async setTaskAssignments(taskId: number, contactIds: number[]): Promise<void> {
    await this.supabaseService.deleteTaskAssignments(taskId);

    if (contactIds.length > 0) {
      const newData = contactIds.map((contactId) => ({
        task_id: taskId,
        contact_id: contactId,
      }));
      console.log(newData);

      await this.supabaseService.addData(newData, 'task-assignment');
    }

    await this.getAllTasks();
  }
  //#endregion
}
