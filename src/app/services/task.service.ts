import { inject, Service, signal } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { TaskInterface } from '../interfaces/task.interface';
import { SubtaskInterface } from '../interfaces/subtask.interface';

@Service()
export class TaskService {
  supabaseService = inject(SupabaseService);
  tasks = signal<TaskInterface[]>([]);

  constructor() {
    this.getAllTasks();
  }

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

  async addTask(taskData: TaskInterface) {
    const newTask = await this.supabaseService.addData(taskData, 'tasks');
    if (newTask) {
      this.getAllTasks();
    }
  }

  async updateTask(taskData: TaskInterface) {
    const success = await this.supabaseService.updateData(taskData.id, taskData, 'tasks');

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
  async addSubtask(subtaskData: SubtaskInterface, taskId: number) {
    const subtask = {
      ...subtaskData,
      task_id: taskId,
    };
    await this.supabaseService.addData(subtask, 'subtasks');
    await this.getAllTasks();
  }
  //#endregion

  //#region USER
  async assignUser(taskId: number, userId: number) {
    const data = {
      task_id: taskId,
      contact_id: userId,
    };
    await this.supabaseService.addData(data, 'task-assignment');
    await this.getAllTasks();
  }
  //#endregion
}
