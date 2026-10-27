import { ContactInterface } from './contact.interface';
import { SubtaskInterface } from './subtask.interface';

export interface TaskInterface {
  id: number;
  position: number; // position added for drag and drop (also in database)
  title: string;
  description: string;
  due_date: string;
  priority: 'urgent' | 'medium' | 'low';
  category: 'User Story' | 'Technical Task';
  status: 'To do' | 'In progress' | 'Await feedback' | 'Done';
  subtasks?: SubtaskInterface[] | [];
  assigned_users: ContactInterface[];
}
