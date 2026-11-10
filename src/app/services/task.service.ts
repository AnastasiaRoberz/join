import { computed, inject, Service, signal } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { TaskInterface } from '../interfaces/task.interface';
import { SubtaskInterface } from '../interfaces/subtask.interface';
import { ResponsiveService } from './responsive.service';
import { Router } from '@angular/router';
import { DialogService } from './dialog.service';

/** Filter of the board: show only tasks with a status, a priority, or an (open) deadline. */
export type BoardFilter =
  | { type: 'status'; status: TaskInterface['status']; label: string }
  | { type: 'priority'; priority: TaskInterface['priority']; label: string }
  | { type: 'deadline'; dueDate?: string; label: string };

/** PostgREST select pattern: task with its subtasks and the contacts assigned via `task-assignment`. */
const TASK_SELECT =
  '*, subtasks(*), task-assignment(contacts(id, firstname, surname, badge_color))';

/**
 * Domain service managing tasks, subtasks, and user (contact) assignments.
 * Acts as the single source of truth for task state within the application using Angular Signals.
 *
 * @remarks
 * Data model: `tasks` (main rows), `subtasks` (1:N child rows), `task-assignment` (N:M join).
 * Subtasks and assignments are collected locally and persisted via {@link TaskService.setTaskSubtasks}
 * and {@link TaskService.setTaskAssignments}. Subtask completion (`is_done`) persists immediately.
 */
@Service()
export class TaskService {
  /** Low-level database gateway used for all queries and mutations. */
  private readonly supabaseService = inject(SupabaseService);
  /** Angular Router used for programmatic navigation to board and tasks. */
  private readonly router = inject(Router);
  /** Responsive service used to determine mobile layout behavior. */
  private readonly responsiveService = inject(ResponsiveService);
  /** Dialog service used to trigger modals and overlays. */
  private readonly dialogService = inject(DialogService);

  /**
   * Reactive list of all tasks, including their nested `subtasks` and flattened `assigned_users`.
   * Filled by {@link TaskService.getAllTasks} and patched in place by the update/delete methods.
   */
  public readonly tasks = signal<TaskInterface[]>([]);

  /** Active board filter, `null` if all tasks are shown. */
  public readonly boardFilter = signal<BoardFilter | null>(null);

  /** Active search term filtering board tasks in real time. */
  public readonly searchQuery = signal<string>('');

  /** Last task created on the board, so its column can scroll to it. */
  public readonly lastAddedTask = signal<TaskInterface | null>(null);

  /** Status of the column the next new task is added to (default `'To do'`). */
  public readonly addTaskStatus = signal<TaskInterface['status']>('To do');

  /** The tasks that match `boardFilter` and `searchQuery` (all tasks if none set). */
  public readonly filteredTasks = computed<TaskInterface[]>(() => {
    let tasks = this.tasks();
    const filter = this.boardFilter();
    if (filter) {
      switch (filter.type) {
        case 'status':
          tasks = tasks.filter((task) => task.status === filter.status);
          break;
        case 'priority':
          tasks = tasks.filter((task) => task.priority === filter.priority);
          break;
        case 'deadline':
          tasks = tasks.filter((task) => this.matchesDeadlineFilter(task, filter.dueDate));
          break;
      }
    }
    const query = this.searchQuery().trim().toLowerCase();
    if (query) {
      tasks = tasks.filter(
        (task) =>
          task.title.toLowerCase().includes(query) ||
          (task.description && task.description.toLowerCase().includes(query)),
      );
    }
    return tasks;
  });

  /**
   * Derived computed signal containing the filtered tasks sorted alphabetically by `title`
   * (locale-aware, via `localeCompare`). Sorts a shallow copy, so `tasks` is never mutated.
   */
  public readonly sortedTasks = computed<TaskInterface[]>(() => {
    return [...this.filteredTasks()].sort((a, b) => a.title.localeCompare(b.title));
  });

  /**
   * Automatically fetches all tasks from Supabase upon service instantiation.
   * The call is not awaited, so `tasks` is empty until the request has finished.
   */
  constructor() {
    this.getAllTasks();
  }

  /**
   * Sets the board filter.
   *
   * @param filter - The filter to apply, or `null` to show all tasks.
   */
  public setBoardFilter(filter: BoardFilter | null): void {
    this.boardFilter.set(filter);
  }

  /** Removes the board filter and resets the search query. */
  public clearBoardFilter(): void {
    this.boardFilter.set(null);
    this.searchQuery.set('');
  }

  /**
   * Queries all tasks with their subtasks and assigned contacts, flattens the nested
   * `task-assignment` structure into `assigned_users` and replaces the `tasks` signal.
   * If the query fails (nothing is shown to the user), `tasks` keeps its previous value.
   * Call this after changes that are not patched locally (e.g. after `setTaskSubtasks`).
   *
   * @returns A promise that resolves once the local signal has been synchronized with the database
   */
  public async getAllTasks(): Promise<void> {
    const taskData = await this.supabaseService.getData('tasks', TASK_SELECT);
    if (!taskData) return;

    this.tasks.set(taskData.map((task: any) => this.mapTaskRecord(task)));
  }

  /**
   * Inserts a new task row into the `tasks` table and, on success, reloads all tasks via
   * {@link TaskService.getAllTasks} so the local signal contains the new task with clean relational joins.
   *
   * @remarks
   * Only the main task row is created. Subtasks and assignments are persisted separately with
   * {@link TaskService.setTaskSubtasks} and {@link TaskService.setTaskAssignments}.
   * `SupabaseService.addData` shows a success or error toast. On failure no reload happens.
   *
   * @param taskData - The task payload without `id` and `position`. It is inserted as is, so it must
   *                   only contain real columns of the `tasks` table (no `subtasks` or `assigned_users`)
   * @returns A promise resolving to the created task, or `null` on failure
   */
  public async addTask(
    taskData: Omit<TaskInterface, 'id' | 'position'>,
  ): Promise<TaskInterface | null> {
    const newTask = await this.supabaseService.addData(taskData, 'tasks');
    if (!newTask) return null;

    await this.getAllTasks();
    this.lastAddedTask.set(newTask); // a new object every time for scroll to top
    return newTask;
  }

  /**
   * Updates an existing task row and, on success, patches the local `tasks` signal without a re-fetch.
   * Existing `subtasks` and `assigned_users` of the local task are kept if not provided in `taskData`.
   *
   * @remarks
   * The whole `taskData` object is sent to the `tasks` table, so it must only contain real columns.
   * Use {@link TaskService.setTaskSubtasks} and {@link TaskService.setTaskAssignments} for the relations.
   * `SupabaseService.updateData` shows a success or error toast. On failure the local signal is untouched.
   *
   * @param id - The ID of the task to update
   * @param taskData - A partial task entity containing only the fields to change
   * @returns A promise that resolves after the remote update and local signal modification
   */
  public async updateTask(id: number, taskData: Partial<TaskInterface>): Promise<void> {
    const success = await this.supabaseService.updateData(id, taskData, 'tasks');

    if (success) {
      this.tasks.update((list) =>
        list.map((task) => (task.id === id ? this.mergeTaskChanges(task, taskData) : task)),
      );
    }
  }

  /**
   * Opens the Add Task form. Mobile/tablet: navigates to the Add Task page. Desktop: opens the dialog.
   * It is a service method, because it is called from the board header and from the board columns.
   *
   * @param status - Status (column) the new task is added to. Defaults to `'To do'`
   */
  public openAddTask(status: TaskInterface['status'] = 'To do'): void {
    this.addTaskStatus.set(status);
    if (this.responsiveService.isMobile() || this.responsiveService.isTablet()) {
      this.router.navigate(['/app/add-task']);
    } else {
      this.dialogService.openDialog('add-task');
    }
  }

  /**
   * Saves the new order of a column after drag and drop.
   * Updates the local signal first so the card doesn't jump back,
   * then stores `status` and `position` of every task in the column.
   *
   * @param columnTasks - All tasks of the target column, in their new order
   * @param movedTaskId - Id of the card that changed its column (only this one shows a toast), or `null`
   */
  public async saveColumn(
    columnTasks: TaskInterface[],
    movedTaskId: number | null = null,
  ): Promise<void> {
    // tasks of the moved column are replaced by their new version, all others stay unchanged
    this.tasks.update((list) =>
      list.map((task) => columnTasks.find((moved) => moved.id === task.id) ?? task),
    );

    await Promise.all(
      columnTasks.map((task) => this.persistColumnTaskOrder(task, task.id === movedTaskId)),
    );
  }

  /**
   * Persists the `is_done` flag of a single subtask immediately (e.g. when a subtask checkbox is
   * toggled) and patches the matching subtask in the local `tasks` signal.
   *
   * @remarks
   * This is the only subtask change that is written to the database right away. All other subtask
   * changes are collected in the edit form and saved via {@link TaskService.setTaskSubtasks}.
   * On failure the local signal is left untouched.
   *
   * @param subtaskId - The primary key of the subtask in the `subtasks` table
   * @param isDone - The new completion state
   * @returns A promise that resolves after the database update and the local signal update
   */
  public async updateSubtaskStatus(subtaskId: number, isDone: boolean): Promise<void> {
    const success = await this.supabaseService.updateData(
      subtaskId,
      { is_done: isDone },
      'subtasks',
    );

    if (success) this.patchLocalSubtaskStatus(subtaskId, isDone);
  }

  /**
   * Deletes a task from the `tasks` table and, on success, removes it from the local `tasks` signal.
   *
   * @remarks
   * Only the main task row is deleted explicitly. Removing its `subtasks` and `task-assignment` rows
   * depends on the database (e.g. `ON DELETE CASCADE`). On failure the local signal is left untouched.
   *
   * @param id - The ID of the task to delete
   * @returns A promise resolving after deletion and state synchronization
   */
  public async deleteTask(id: number): Promise<void> {
    const success = await this.supabaseService.deleteData(id, 'tasks');

    if (success) {
      this.tasks.update((list) => list.filter((task) => task.id !== id));
    }
  }

  /**
   * Replaces ALL subtasks of a task with the given list ("delete all, then re-insert")
   * and reloads all tasks via {@link TaskService.getAllTasks}.
   * Called once when the user confirms the main task in the edit form.
   *
   * @remarks
   * Only `title`, `is_done` (default `false`) and `task_id` are written. The list is inserted in
   * REVERSED order, so the first item receives the highest database ID and, as subtasks are
   * displayed sorted by ID descending, appears on top. All subtasks get NEW IDs on every save.
   *
   * There is no transaction: if the insert fails after the delete succeeded, the task ends up
   * without subtasks. No exception is thrown and no toast is shown for the `subtasks` table.
   *
   * @param taskId - The ID of the task the subtasks belong to
   * @param subtasks - The complete new list of subtasks in display order (top item first).
   *                   An empty array removes all subtasks of the task
   * @returns A promise that resolves after the database was updated and the tasks were reloaded
   */
  public async setTaskSubtasks(taskId: number, subtasks: Omit<SubtaskInterface, 'id'>[]): Promise<void> {
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
   * Replaces ALL contact assignments of a task with the given list ("delete all, then re-insert")
   * and reloads all tasks via {@link TaskService.getAllTasks} so `assigned_users` is up to date.
   * Called once when the user confirms the main task in the edit form.
   *
   * @remarks
   * There is no transaction: if the insert fails after the delete succeeded, the task ends up
   * without assignments. No exception is thrown and no toast is shown for the `task-assignment` table.
   *
   * @param taskId - The ID of the task to update
   * @param contactIds - The complete new list of contact IDs assigned to the task.
   *                     An empty array removes all assignments of the task
   * @returns A promise that resolves after the database was updated and the tasks were reloaded
   */
  public async setTaskAssignments(taskId: number, contactIds: number[]): Promise<void> {
    await this.supabaseService.deleteTaskAssignments(taskId);

    if (contactIds.length > 0) {
      const newData = contactIds.map((contactId) => ({
        task_id: taskId,
        contact_id: contactId,
      }));

      await this.supabaseService.addData(newData, 'task-assignment');
    }

    await this.getAllTasks();
  }

  /**
   * Checks whether a task belongs to the deadline filter: it is not done and,
   * if a due date is given, is due on that day.
   *
   * @param task - The task to check
   * @param dueDate - Optional due date (`YYYY-MM-DD...`) the task has to match
   */
  private matchesDeadlineFilter(task: TaskInterface, dueDate?: string): boolean {
    if (task.status === 'Done') return false;
    if (dueDate) return task.due_date.slice(0, 10) === dueDate.slice(0, 10);
    return true;
  }

  /**
   * Maps a raw row of the joined task query to a `TaskInterface`:
   * `subtasks` defaults to `[]` and `task-assignment` is flattened into `assigned_users`.
   *
   * @param task - Raw row returned by `getData('tasks', TASK_SELECT)`
   */
  private mapTaskRecord(task: any): TaskInterface {
    return {
      ...task,
      subtasks: task.subtasks ?? [],
      assigned_users: task['task-assignment']
        ? task['task-assignment'].map((a: any) => a.contacts)
        : [],
    } as TaskInterface;
  }

  /**
   * Applies changed fields to a local task. `subtasks` and `assigned_users` are kept
   * if `taskData` does not contain them.
   *
   * @param task - The current local task
   * @param taskData - The changed fields
   */
  private mergeTaskChanges(task: TaskInterface, taskData: Partial<TaskInterface>): TaskInterface {
    return {
      ...task,
      ...taskData,
      subtasks: taskData.subtasks ?? task.subtasks,
      assigned_users: taskData.assigned_users ?? task.assigned_users,
    };
  }

  /**
   * Saves `status` and `position` (only these two fields) of one task of a column.
   *
   * @param task - The task with its new status and position
   * @param showFeedback - Whether a toast is shown (only for the card that changed its column)
   */
  private persistColumnTaskOrder(task: TaskInterface, showFeedback: boolean): Promise<boolean> {
    return this.supabaseService.updateData(
      task.id,
      { status: task.status, position: task.position },
      'tasks',
      showFeedback,
    );
  }

  /**
   * Sets `is_done` of one subtask in the local `tasks` signal.
   *
   * @param subtaskId - The id of the subtask
   * @param isDone - The new completion state
   */
  private patchLocalSubtaskStatus(subtaskId: number, isDone: boolean): void {
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
