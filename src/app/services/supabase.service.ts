import { inject, Service, signal } from '@angular/core';
import { createClient } from '@supabase/supabase-js';
import { capitalizeFirstLetter, getRandomColor } from '../utils/utils';
import { FeedbackService } from './feedback.service';
import { environment } from '../../environment/environment';
import { TaskInterface } from '../interfaces/task.interface';

@Service()
export class SupabaseService {
  projectUrl = environment.supabaseUrl;
  projectKey = environment.supabaseAnonKey;
  supabase = createClient(this.projectUrl, this.projectKey);

  feedbackService = inject(FeedbackService);

  async getData(table: string, selectedData: string = '*'): Promise<any[] | null> {
    let { data, error } = await this.supabase.from(table).select(selectedData);

    if (error) {
      console.log(`Error fetching data from ${table}: `, error);
      return null;
    }

    return data;
  }

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

  async addData<T extends Record<string, any>>(data: T, table: string): Promise<any | null> {
    const { data: supabaseData, error } = await this.supabase
      .from(table)
      .insert(data)
      .select()
      .single();

    if (!error) {
      this.feedbackService.showSuccess(`${capitalizeFirstLetter(table)} succesfully created.`);
      return supabaseData;
    } else {
      this.feedbackService.showError(`Create ${table} failed.`);
      return null;
    }
  }

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
      this.feedbackService.showSuccess(`${capitalizeFirstLetter(table)} succesfully updated.`);
      return true;
    } else {
      this.feedbackService.showError(`Update ${table} failed.`);
      return false;
    }
  }

  async deleteData(id: number, table: string): Promise<boolean> {
    const { error } = await this.supabase.from(table).delete().eq('id', id);

    if (!error) {
      this.feedbackService.showSuccess(`${capitalizeFirstLetter(table)} succesfully deleted.`);
      return true;
    } else {
      this.feedbackService.showError(`Delete ${table} failed.`);
      return false;
    }
  }
}
