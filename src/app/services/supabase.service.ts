import { inject, Service } from '@angular/core';
import { createClient, Session, SupabaseClient, User } from '@supabase/supabase-js';
import { capitalizeFirstLetter } from '../utils/utils';
import { FeedbackService } from './feedback.service';
import { environment } from '../../environment/environment';
import { UserInterface } from './user.service';

/** Write operations that report their result via a toast. */
type CrudAction = 'Create' | 'Update' | 'Delete';

/** Past tense of each `CrudAction` for the success message. */
const CRUD_PAST_TENSE: Record<CrudAction, string> = {
  Create: 'created',
  Update: 'updated',
  Delete: 'deleted',
};

/** Result of a successful sign up / sign in. */
type AuthResult = { user: User | null; session: Session | null };

/**
 * Low-level database gateway and abstraction layer for the Supabase JavaScript client.
 * Provides generic CRUD operations across all PostgreSQL tables and triggers user-facing
 * success/error notifications via `FeedbackService` for the tables `tasks` and `contacts`.
 * Failed read operations are not reported, they result in `null`.
 */
@Service()
export class SupabaseService {
  /** The Supabase project URL loaded from environment settings. */
  private readonly projectUrl: string = environment.supabaseUrl;
  /** The Supabase anonymous API key loaded from environment settings. */
  private readonly projectKey: string = environment.supabaseAnonKey;

  /** Supabase client, also used directly for authentication and custom queries. */
  public readonly supabase: SupabaseClient = createClient(this.projectUrl, this.projectKey);

  /** Feedback service used to display toast notifications upon database operations. */
  private readonly feedbackService = inject(FeedbackService);

  /** Tables that show toasts after create, update and delete (table name -> entity name). */
  private readonly allowedFeedbackTables: Record<string, string> = {
    tasks: 'Task',
    contacts: 'Contact',
  };

  /**
   * Retrieves an array of records from a specific table.
   *
   * @param table - The name of the database table to query
   * @param selectedData - The SQL/PostgREST select pattern defining columns or joined tables. Defaults to `'*'`
   * @returns A promise resolving to an array of matching rows, or `null` if the request encounters an error
   *
   * @example
   * const contacts = await supabaseService.getData('contacts');
   * const tasks = await supabaseService.getData('tasks', '*, subtasks(*)');
   */
  public async getData(table: string, selectedData: string = '*'): Promise<any[] | null> {
    let { data, error } = await this.supabase.from(table).select(selectedData);

    if (error) {
      return null;
    }

    return data;
  }

  /**
   * Fetches a single record by its primary key ID.
   *
   * @remarks
   * Relies on `.single()`, which enforces that exactly one row matches.
   * If zero or multiple rows are found, PostgREST returns an error and this method returns `null`.
   *
   * @param table - The name of the database table to query
   * @param id - The primary key ID of the record
   * @param selectedData - The SQL/PostgREST select pattern. Defaults to `'*'`
   * @returns A promise resolving to the record object, or `null` if not found or on error
   */
  public async getOneItem(table: string, id: number, selectedData: string = '*'): Promise<any | null> {
    let { data, error } = await this.supabase
      .from(table)
      .select(selectedData)
      .eq('id', id)
      .single();

    if (error) {
      return null;
    }

    return data;
  }

  /**
   * Inserts a new record (or array of records) into a table and immediately selects and returns the created row(s).
   * Triggers a success or error notification via {@link FeedbackService} (only for `tasks` and `contacts`).
   *
   * @template T - The shape of the payload extending a key-value record
   * @param data - The data object or array of objects to insert (omitting generated keys such as `id`)
   * @param table - The target database table name
   * @param showFeedback - Set to `false` to suppress the notification. Defaults to `true`
   * @returns A promise resolving to the freshly created database row(s) (including server-generated values like `id`), or `null` on failure
   */
  public async addData<T extends Record<string, any>>(
    data: T | T[],
    table: string,
    showFeedback: boolean = true,
  ): Promise<any | null> {
    let query = this.supabase
      .from(table)
      .insert(data as any)
      .select();
    if (!Array.isArray(data)) query = query.single() as any;
    const { data: result, error } = await query;

    if (showFeedback) this.notifyCrudResult(table, 'Create', !error);
    return error ? null : result;
  }

  /**
   * Updates an existing database row identified by its primary key ID.
   * Triggers a success or error notification via {@link FeedbackService} (only for `tasks` and `contacts`).
   *
   * @template T - The shape of the entity being updated
   * @param id - The primary key ID of the target record
   * @param data - A partial or complete object of fields to be updated
   * @param table - The target database table name
   * @param showFeedback - Set to `false` to suppress the notification. Defaults to `true`
   * @returns A promise resolving to `true` if the update succeeded, or `false` on failure
   */
  public async updateData<T extends Record<string, any>>(
    id: number,
    data: Partial<T>,
    table: string,
    showFeedback: boolean = true,
  ): Promise<boolean> {
    const { error } = await this.supabase
      .from(table)
      .update(data as any)
      .eq('id', id);

    if (showFeedback) this.notifyCrudResult(table, 'Update', !error);
    return !error;
  }

  /**
   * Removes a record from a database table based on its primary key ID.
   * Triggers a success or error notification via {@link FeedbackService} (only for `tasks` and `contacts`).
   *
   * @param id - The primary key ID of the record to delete
   * @param table - The target database table name
   * @returns A promise resolving to `true` if successfully deleted, or `false` on failure
   */
  public async deleteData(id: number, table: string): Promise<boolean> {
    const { error } = await this.supabase.from(table).delete().eq('id', id);

    this.notifyCrudResult(table, 'Delete', !error);
    return !error;
  }

  /**
   * Deletes all subtask rows associated with a given parent task ID from the `subtasks` table.
   * Used when synchronizing/replacing a task's subtasks in bulk.
   *
   * @param taskId - The parent task ID whose subtasks should be deleted
   * @returns A promise that resolves once the deletion query has completed
   */
  public async deleteTaskSubtasks(taskId: number): Promise<void> {
    await this.supabase.from('subtasks').delete().eq('task_id', taskId);
  }

  /**
   * Deletes all contact assignment rows associated with a given task ID from the `task-assignment` join table.
   * Used when synchronizing/replacing a task's assigned contacts in bulk.
   *
   * @param taskId - The target task ID whose assignments should be cleared
   * @returns A promise that resolves once the deletion query has completed
   */
  public async deleteTaskAssignments(taskId: number): Promise<void> {
    await this.supabase.from('task-assignment').delete().eq('task_id', taskId);
  }

  /**
   * Registers a new user in Supabase Auth and shows a success or error toast.
   *
   * @param userData - Credentials and profile data of the new user
   * @returns A promise resolving to the created user and session, or `null` on failure
   */
  public async userSignUp(userData: UserInterface): Promise<AuthResult | null> {
    const { data, error } = await this.supabase.auth.signUp(userData);

    if (!error) {
      this.feedbackService.showSuccess(`New user successfully created.`);
      return data;
    } else {
      this.feedbackService.showError(`Create new user failed.`);
      return null;
    }
  }

  /**
   * Logs in with mail and password and shows an error toast on failure.
   *
   * @param userData - Mail address and password
   * @returns A promise resolving to the user and session, or `null` on failure
   */
  public async signInWithEmail(userData: {
    mail: string;
    password: string;
  }): Promise<AuthResult | null> {
    const { data, error } = await this.supabase.auth.signInWithPassword({
      email: userData.mail,
      password: userData.password,
    });

    if (error) this.feedbackService.showError(`Log in failed.`);
    return error ? null : data;
  }

  /**
   * Logs in as an anonymous guest and shows an error toast on failure.
   *
   * @returns A promise resolving to the guest user and session, or `null` on failure
   */
  public async anonymSignIn(): Promise<AuthResult | null> {
    const { data, error } = await this.supabase.auth.signInAnonymously();

    if (error) this.feedbackService.showError(`Log in failed.`);
    return error ? null : data;
  }

  /**
   * Updates an auth user by ID and refreshes the current session.
   *
   * @param userUid - UID of the auth user to update
   * @param userData - Partial user fields (e.g. `email`, `user_metadata`)
   * @returns A promise resolving to the updated user, or `null` on failure
   */
  public async updateUser(userUid: string, userData: Partial<User>): Promise<User | null> {
    const { error } = await this.supabase.auth.admin.updateUserById(userUid, userData as any);
    if (!error) {
      this.feedbackService.showSuccess(`User successfully updated.`);
      const { data: refreshData, error: refreshError } = await this.supabase.auth.refreshSession();
      return refreshError ? null : refreshData.user;
    } else {
      this.feedbackService.showError(`Update user failed.`);
      return null;
    }
  }

  /**
   * Deletes an auth user via the database function `delete_auth_user` and shows a success or error toast.
   *
   * @param uid - Id of the auth user to delete
   * @returns A promise resolving to `true` if the user was deleted, otherwise `false`
   */
  public async deleteUser(uid: string): Promise<boolean> {
    const { error } = await this.supabase.rpc('delete_auth_user', { target_uid: uid });

    if (!error) {
      this.feedbackService.showSuccess(`User successfully deleted.`);
      return true;
    } else {
      this.feedbackService.showError(`Delete user failed.`);
      return false;
    }
  }

  /**
   * Shows the success or error toast of a create, update or delete operation.
   * Does nothing for tables that are not listed in `allowedFeedbackTables`.
   *
   * @param table - The table the operation ran on (singular entity name = table name without the last letter)
   * @param action - The operation that was executed
   * @param success - Whether the operation succeeded
   */
  private notifyCrudResult(table: string, action: CrudAction, success: boolean): void {
    if (!this.allowedFeedbackTables[table]) return;
    const entity = table.slice(0, -1);

    if (success) {
      this.feedbackService.showSuccess(
        `${capitalizeFirstLetter(entity)} successfully ${CRUD_PAST_TENSE[action]}.`,
      );
    } else {
      this.feedbackService.showError(`${action} ${entity} failed.`);
    }
  }
}
