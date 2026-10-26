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
   *
   * @param taskData - The task data payload without an `id`
   * @returns A promise that resolves when insertion and refresh are complete
   */
  async addTask(taskData: Omit<TaskInterface, 'id'>) {
    const newTask = await this.supabaseService.addData(taskData, 'tasks');
    if (newTask) {
      this.getAllTasks();
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
          task.id === taskData.id
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

  async updateSubtask(
    subtaskId: number,
    taskId: number,
    subtaskData: Partial<SubtaskInterface>,
  ): Promise<void> {
    const success = await this.supabaseService.updateData(subtaskId, subtaskData, 'subtasks');

    if (success) {
      this.tasks.update((list) =>
        list.map((task) => {
          if (task.id !== taskId) return task;
          return {
            ...task,
            subtasks: task.subtasks?.map((subtask) =>
              subtask.id === subtaskId ? { ...subtask, ...subtaskData } : subtask,
            ),
          };
        }),
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
  async deleteTask(id: number, task: 'main' | 'sub') {
    const table = task === 'main' ? 'tasks' : 'subtasks';
    const success = await this.supabaseService.deleteData(id, table);

    if (success) {
      if (task === 'main') {
        this.tasks.update((list) => list.filter((task) => task.id !== id));
      } else {
        this.tasks.update((list) =>
          list.map((task) => ({
            ...task,
            subtasks: task.subtasks?.filter((subtask) => subtask.id !== id) ?? [],
          })),
        );
      }
    }
  }

  //#region SUBTASKS
  /**
   * Creates a subtask bound to a specific parent task via `task_id` and refreshes all tasks.
   *
   * @param subtaskData - The subtask payload (excluding `id`)
   * @param taskId - The ID of the parent task this subtask belongs to
   * @returns A promise that resolves when the subtask is created and state refreshed
   */
  async addSubtask(
    subtaskData: Omit<SubtaskInterface, 'id'>,
    taskId: number,
  ): Promise<SubtaskInterface> {
    const subtask = {
      ...subtaskData,
      task_id: taskId,
    };
    const newSubtask = await this.supabaseService.addData(subtask, 'subtasks');
    await this.getAllTasks();
    return newSubtask;
  }
  //#endregion

  //#region USER
  /**
   * Links a contact to a task by creating an entry in the `task-assignment` join table.
   * Refreshes the task list to reflect the updated assignments across the UI.
   *
   * @param taskId - The target task ID
   * @param userId - The contact ID to assign
   * @returns A promise that resolves after the assignment is persisted and tasks are reloaded
   */
  async setTaskAssignment(taskId: number, contactIds: number[]): Promise<void> {
    await this.supabaseService.deleteAssignment(taskId);

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
