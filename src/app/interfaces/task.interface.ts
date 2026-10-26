import { SubtaskInterface } from './subtask.interface';

export interface TaskInterface {
  id: number;
  title: string;
  description: string;
  due_date: string;
  priority: 'urgent' | 'medium' | 'low';
  category: 'User Story' | 'Technical Task';
  status: 'To do' | 'In progress' | 'Await feedback' | 'Done';
  assigned_users: { id: number; firstname: string; surname: string; badge_color: string }[];
  subtasks: SubtaskInterface[] | [];
}
