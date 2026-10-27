import { computed, inject, Service, signal } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { TaskInterface } from '../interfaces/task.interface';
import { SubtaskInterface } from '../interfaces/subtask.interface';

/**
 * Domain service managing tasks, subtasks, and user (contact) assignments.
 * Acts as the single source of truth for task state within the application using Angular Signals.
 *
 * @remarks
 * Data model (PostgreSQL tables behind {@link SupabaseService}):
 * - `tasks`: the main task rows.
 * - `subtasks`: 1:N child rows of a task (`task_id` foreign key, `is_done` flag).
 * - `task-assignment`: N:M join table between `tasks` and `contacts` (`task_id`, `contact_id`).
 *
 * Write strategy (important for everyone working with this service):
 * - Subtasks and assignments are NOT written one by one while the user edits a task.
 *   The edit form (e.g. `task-edit`) collects them locally and only after the user confirms the
 *   main task, they are persisted in one go via {@link TaskService.setTaskSubtasks} and
 *   {@link TaskService.setTaskAssignments} (both use a "delete all, then re-insert" strategy).
 * - The only value persisted immediately is the `is_done` flag of a subtask, via
 *   {@link TaskService.updateSubtaskStatus} (e.g. when a checkbox is toggled on the board).
 *
 * User feedback:
 * - This service shows no toasts itself. Success / error toasts are triggered inside
 *   {@link SupabaseService} (via `FeedbackService`) for every insert, update and delete it performs.
 *
 * Typical flow when saving a new task:
 * 1. `addTask(...)` to create the main task.
 * 2. `setTaskSubtasks(id, ...)` and `setTaskAssignments(id, ...)` to persist the related records.
 */
@Service()
export class TaskService {
  /** Low-level database gateway used for all queries and mutations. */
  supabaseService = inject(SupabaseService);

  /**
   * Reactive list of all tasks, including their nested `subtasks` and flattened `assigned_users`.
   * Filled by {@link TaskService.getAllTasks} and patched in place by the update/delete methods.
   */
  tasks = signal<TaskInterface[]>([]);

  /**
   * Automatically fetches all tasks from Supabase upon service instantiation.
   * The call is not awaited, so `tasks` is empty until the request has finished.
   */
  constructor() {
    this.getAllTasks();
  }

  /**
   * Queries all tasks from the `tasks` table with deep PostgREST joins:
   * - 1:N join on `subtasks`
   * - N:M join across `task-assignment` pulling related `contacts`
   *
   * Flattens the nested assignment structure into `assigned_users` (array of contacts with
   * `id`, `firstname`, `surname`, `badge_color`), defaults missing `subtasks` to `[]` and
   * replaces the whole `tasks` signal with the result.
   *
   * @remarks
   * Error handling: if the query fails, `SupabaseService.getData` logs the error and returns
   * `null`. In that case this method returns early and the `tasks` signal keeps its previous value.
   * No toast is shown for read operations.
   *
   * Call this after any change that is not patched locally (e.g. after `setTaskSubtasks`)
   * to get fresh relational data.
   *
   * @returns A promise that resolves once the local signal has been synchronized with the database
   * (or immediately if the fetch failed)
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
   * Fetches a single task by ID directly from the database along with its subtasks and assigned users.
   * Applies the same mapping as {@link TaskService.getAllTasks} (`subtasks` defaults to `[]`,
   * `task-assignment` is flattened into `assigned_users`).
   *
   * @remarks
   * Does NOT modify the `tasks` signal; the result is only returned to the caller.
   * Errors (including "no row found") are logged by `SupabaseService.getOneItem` and result in `null`.
   *
   * @param id - The ID of the target task
   * @returns A promise resolving to the structured `TaskInterface` entity, or `null` if not found or on error
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

  /**
   * Derived computed signal containing all tasks sorted alphabetically by `title`
   * (locale-aware, via `localeCompare`).
   *
   * @remarks
   * Sorts a shallow copy, so the underlying `tasks` signal is never mutated.
   * Recalculates automatically whenever `tasks` changes.
   */
  sortedTasks = computed(() => {
    return [...this.tasks()].sort((a, b) => a.title.localeCompare(b.title));
  });

  /**
   * Inserts a new task row into the `tasks` table and, on success, reloads all tasks via
   * {@link TaskService.getAllTasks} so the local signal contains the new task with clean relational joins.
   *
   * @remarks
   * - Only the main task row is created. Subtasks and assignments are NOT handled here; persist
   *   them separately with {@link TaskService.setTaskSubtasks} and {@link TaskService.setTaskAssignments}.
   * - This method does NOT return the new task's ID (the return type is `void`).
   * - Feedback: `SupabaseService.addData` shows a success toast ("... succesfully created.") or an
   *   error toast ("Create ... failed."). On failure no reload happens and the signal stays unchanged.
   * - No exception is thrown on failure; errors are only surfaced via the toast.
   *
   * @param taskData - The task data payload without `id`. The payload is inserted as is, so it must
   *                   only contain real columns of the `tasks` table (i.e. no `subtasks` or
   *                   `assigned_users`, as these are managed via their own tables)
   * @returns A promise that resolves after the insert and the subsequent reload have finished
   */
  async addTask(taskData: Omit<TaskInterface, 'id'>): Promise<void> {
    const newTask = await this.supabaseService.addData(taskData, 'tasks');
    if (newTask) {
      await this.getAllTasks();
    }
  }

  /**
   * Updates an existing task row in the database and, on success, applies an in-place update
   * to the local `tasks` signal without triggering a network re-fetch.
   * Existing `subtasks` and `assigned_users` of the local task are preserved if not provided in `taskData`.
   *
   * @remarks
   * - The whole `taskData` object is sent to the `tasks` table, so it must only contain real columns
   *   of that table. Do not pass `subtasks` or `assigned_users` here; use
   *   {@link TaskService.setTaskSubtasks} and {@link TaskService.setTaskAssignments} for those.
   * - Feedback: `SupabaseService.updateData` shows a success toast ("... succesfully updated.") or an
   *   error toast ("Update ... failed."). On failure the local signal is left untouched.
   * - No exception is thrown on failure.
   *
   * @param id - The ID of the task to update
   * @param taskData - A partial task entity containing only the fields to change
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

  /**
   * Persists the `is_done` flag of a single subtask immediately (e.g. when a subtask checkbox is
   * toggled) and patches the matching subtask in the local `tasks` signal.
   *
   * @remarks
   * This is the only subtask change that is written to the database right away. All other subtask
   * changes (add, rename, remove, reorder) are collected locally in the edit form and saved
   * together with the main task via {@link TaskService.setTaskSubtasks}.
   *
   * Feedback: `SupabaseService.updateData` shows a success toast ("Subtask succesfully updated.") or an
   * error toast ("Update subtask failed."). On failure the local signal is left untouched.
   * No exception is thrown on failure.
   *
   * @param subtaskId - The primary key of the subtask in the `subtasks` table
   * @param isDone - The new completion state
   * @returns A promise that resolves after the database update and the local signal update
   */
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
   * Deletes a task from the `tasks` table and, on success, removes it from the local `tasks` signal.
   *
   * @remarks
   * - Only the main task row is deleted explicitly. This method does not delete the task's rows in
   *   `subtasks` or `task-assignment` itself, so removing them depends on the database
   *   (e.g. `ON DELETE CASCADE` foreign keys).
   * - Feedback: `SupabaseService.deleteData` shows a success toast ("... succesfully deleted.") or an
   *   error toast ("Delete ... failed."). On failure the local signal is left untouched.
   * - No exception is thrown and nothing is returned, so callers cannot tell whether it succeeded.
   *
   * @param id - The ID of the task to delete
   * @returns A promise resolving after deletion and state synchronization
   */
  async deleteTask(id: number) {
    const success = await this.supabaseService.deleteData(id, 'tasks');

    if (success) {
      this.tasks.update((list) => list.filter((task) => task.id !== id));
    }
  }

  /**
   * Replaces ALL subtasks of a task with the given list ("delete all, then re-insert").
   * Called once when the user confirms the main task in the edit form.
   *
   * Steps:
   * 1. Deletes every existing row in `subtasks` with this `task_id`
   *    (`SupabaseService.deleteTaskSubtasks`).
   * 2. If the list is not empty, inserts all items in a single bulk insert. Only `title`, `is_done`
   *    (defaults to `false` if missing) and `task_id` are written; other properties are ignored.
   * 3. Reloads all tasks via {@link TaskService.getAllTasks}.
   *
   * @remarks
   * Order: the list is inserted in REVERSED order, so the first item of `subtasks` receives the
   * highest database ID. Subtasks are displayed sorted by ID descending, therefore the first item
   * of the given list appears on top.
   *
   * Because all rows are deleted and re-created, the subtasks get NEW database IDs on every save.
   * Do not keep old subtask IDs around after calling this method.
   *
   * Error handling / feedback: the delete step shows no toast and its errors are ignored. The
   * insert step shows one success toast ("Subtask succesfully created.") or one error toast
   * ("Create subtask failed."). There is no transaction: if the insert fails after the delete
   * succeeded, the task ends up without subtasks. No exception is thrown in either case.
   *
   * @param taskId - The ID of the task the subtasks belong to
   * @param subtasks - The complete new list of subtasks in display order (top item first).
   *                   An empty array simply removes all subtasks of the task
   * @returns A promise that resolves after the database was updated and the tasks were reloaded
   */
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
   * Replaces ALL contact assignments of a task with the given list ("delete all, then re-insert").
   * Called once when the user confirms the main task in the edit form.
   *
   * Steps:
   * 1. Deletes every row in the `task-assignment` join table with this `task_id`
   *    (`SupabaseService.deleteTaskAssignments`).
   * 2. If `contactIds` is not empty, inserts one `{ task_id, contact_id }` row per contact in a
   *    single bulk insert.
   * 3. Reloads all tasks via {@link TaskService.getAllTasks} so `assigned_users` is up to date.
   *
   * @remarks
   * Error handling / feedback: the delete step shows no toast and its errors are ignored. The
   * insert step shows one success toast or one error toast (generated from the table name by
   * `SupabaseService.addData`). There is no transaction: if the insert fails after the delete
   * succeeded, the task ends up without assignments. No exception is thrown in either case.
   *
   * @param taskId - The ID of the task to update
   * @param contactIds - The complete new list of contact IDs assigned to the task.
   *                     An empty array removes all assignments of the task
   * @returns A promise that resolves after the database was updated and the tasks were reloaded
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
