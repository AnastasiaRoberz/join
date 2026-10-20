import { SubtaskInterface } from './subtask.interface';

export interface TaskInterface {
  id: number;
  title: string;
  description: string;
  due_date: Date;
  priority: 'urgent' | 'medium' | 'low';
  category: 'User Story' | 'Technical Task';
  status: 'To do' | 'In progress' | 'Await feedback' | 'Done';
  subtasks?: SubtaskInterface[];
  assigned_users: { id: number; firstname: string; surname: string; badgeColor: string }[];
}
