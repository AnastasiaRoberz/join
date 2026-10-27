import { inject, Service } from '@angular/core';
import { createClient } from '@supabase/supabase-js';
import { capitalizeFirstLetter } from '../utils/utils';
import { FeedbackService } from './feedback.service';
import { environment } from '../../environment/environment';

/**
 * Low-level database gateway and abstraction layer for the Supabase JavaScript client.
 * Provides generic CRUD operations across all PostgreSQL tables, handles baseline error
 * logging, and triggers user-facing notifications via `FeedbackService`.
 */
@Service()
export class SupabaseService {
  projectUrl = environment.supabaseUrl;
  projectKey = environment.supabaseAnonKey;
  supabase = createClient(this.projectUrl, this.projectKey);

  feedbackService = inject(FeedbackService);

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
  async getData(table: string, selectedData: string = '*'): Promise<any[] | null> {
    let { data, error } = await this.supabase.from(table).select(selectedData);

    if (error) {
      console.log(`Error fetching data from ${table}: `, error);
      return null;
    }

    return data;
  }

  /**
   * Fetches a single record by its primary key ID.
   *
   * @remarks
   * Relies on `.single()`, which enforces that exactly one row matches.
   * If zero or multiple rows are found, PostgREST throws an error which is caught and logged.
   *
   * @param table - The name of the database table to query
   * @param id - The primary key ID of the record
   * @param selectedData - The SQL/PostgREST select pattern[cite: 29]. Defaults to `'*'`
   * @returns A promise resolving to the record object, or `null` if not found or on error
   */
  async getOneItem(table: string, id: number, selectedData: string = '*'): Promise<any | null> {
    let { data, error } = await this.supabase
      .from(table)
      .select(selectedData)
      .eq('id', id)
      .single();

    if (error) {
      console.log(`Error fetching data from ${table}: `, error);
      return null;
    }

    return data;
  }

  /**
   * Inserts a new record into a table and immediately selects and returns the created row.
   *
   * @template T - The shape of the payload extending a key-value record
   * @param data - The data object to insert (omitting generated keys such as `id`)
   * @param table - The target database table name
   * @returns A promise resolving to the freshly created database row (including server-generated values like `id`), or `null` on failure
   */
  async addData<T extends Record<string, any>>(data: T | T[], table: string): Promise<any | null> {
    const isArray = Array.isArray(data);

    let query = this.supabase
      .from(table)
      .insert(data as any)
      .select();
    if (!isArray) query = query.single() as any;
    const { data: result, error } = await query;

    if (!error) {
      this.feedbackService.showSuccess(
        `${capitalizeFirstLetter(table.slice(0, -1))} succesfully created.`,
      );
      return result;
    } else {
      this.feedbackService.showError(`Create ${table.slice(0, -1)} failed.`);
      return null;
    }
  }

  /**
   * Updates an existing database row identified by its ID.
   *
   * @template T - The shape of the entity being updated
   * @param id - The primary key ID of the target record
   * @param data - A partial or complete object of fields to be updated
   * @param table - The target database table name
   * @returns A promise resolving to `true` if the update succeeded, or `false` on failure
   */
  async updateData<T extends Record<string, any>>(
    id: number,
    data: Partial<T>,
    table: string,
  ): Promise<boolean> {
    const { error } = await this.supabase
      .from(table)
      .update(data as any)
      .eq('id', id);

    if (!error) {
      this.feedbackService.showSuccess(
        `${capitalizeFirstLetter(table.slice(0, -1))} succesfully updated.`,
      );
      return true;
    } else {
      this.feedbackService.showError(`Update ${table.slice(0, -1)} failed.`);
      return false;
    }
  }

  /**
   * Removes a record from a database table based on its primary key ID.
   *
   * @param id - The primary key ID of the record to delete
   * @param table - The target database table name
   * @returns A promise resolving to `true` if successfully deleted, or `false` on failure
   */
  async deleteData(id: number, table: string): Promise<boolean> {
    const { error } = await this.supabase.from(table).delete().eq('id', id);

    if (!error) {
      this.feedbackService.showSuccess(
        `${capitalizeFirstLetter(table.slice(0, -1))} succesfully deleted.`,
      );
      return true;
    } else {
      this.feedbackService.showError(`Delete ${table.slice(0, -1)} failed.`);
      return false;
    }
  }

  async deleteTaskSubtasks(taskId: number) {
    const { error } = await this.supabase.from('subtasks').delete().eq('task_id', taskId);
  }

  async deleteTaskAssignments(taskId: number) {
    const { error } = await this.supabase.from('task-assignment').delete().eq('task_id', taskId);
  }
}
