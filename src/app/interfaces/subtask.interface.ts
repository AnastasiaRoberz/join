/** A subtask as stored in the `subtasks` table (1:N child of a task). */
export interface SubtaskInterface {
  id: number;
  title: string;
  is_done: boolean;
  /** Id of the parent task. */
  task_id?: number;
}
