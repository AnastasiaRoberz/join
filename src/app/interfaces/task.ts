export type TaskStatus = 'todo' | 'inProgress' | 'awaitFeedback' | 'done';
export type TaskPriority = 'urgent' | 'medium' | 'low';
export type TaskCategory = 'User Story' | 'Technical Task';

export interface Subtask {
  title: string;
  done: boolean;
}

export interface Task {
  id?: number;
  created_at?: string;
  title: string;
  description?: string;
  due_date: string;
  category: TaskCategory;
  priority: TaskPriority;
  status: TaskStatus;
  assigned_to: number[];
  subtasks: Subtask[];
}