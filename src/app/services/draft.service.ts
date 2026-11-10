import { Service, signal } from '@angular/core';
import { SubtaskInterface } from '../interfaces/subtask.interface';
import { Priority } from '../shared/priority-btn/priority-btn';

/** Data draft of the login form. */
export interface LoginDraft {
  mail?: string;
}

/** Data draft of the registration form. */
export interface RegisterDraft {
  name?: string;
  mail?: string;
  privacy?: boolean;
}

/** Data draft of the Add Task form. */
export interface AddTaskDraft {
  title?: string;
  description?: string;
  date?: string;
  priority?: Priority;
  assigned?: number[];
  category?: string;
  subtasks?: SubtaskInterface[];
}

/**
 * Generic draft service preserving form states across page transitions.
 *
 * Holds temporary form input drafts for authentication (login and register)
 * as well as the Add Task view, allowing users to switch between routes
 * without losing in-progress data.
 */
@Service()
export class DraftService {
  /** Draft of the login form. */
  public readonly loginDraft = signal<LoginDraft>({});

  /** Draft of the register form. */
  public readonly registerDraft = signal<RegisterDraft>({});

  /** Draft of the Add Task form. */
  public readonly addTaskDraft = signal<AddTaskDraft>({});

  /**
   * Checks whether the Add Task draft currently holds any user-entered content.
   *
   * @returns `true` if at least one field has non-empty data, otherwise `false`.
   */
  public hasAddTaskDraft(): boolean {
    const draft = this.addTaskDraft();
    const hasTitle = Boolean(draft.title && draft.title.trim().length > 0);
    const hasDesc = Boolean(draft.description && draft.description.trim().length > 0);
    const hasDate = Boolean(draft.date && draft.date.trim().length > 0);
    const hasCategory = Boolean(draft.category && draft.category.trim().length > 0);
    const hasAssigned = Boolean(draft.assigned && draft.assigned.length > 0);
    const hasSubtasks = Boolean(draft.subtasks && draft.subtasks.length > 0);
    const hasCustomPrio = Boolean(draft.priority && draft.priority !== 'medium');

    return (
      hasTitle || hasDesc || hasDate || hasCategory || hasAssigned || hasSubtasks || hasCustomPrio
    );
  }

  /**
   * Clears the Add Task form draft.
   */
  public clearAddTaskDraft(): void {
    this.addTaskDraft.set({});
  }

  /**
   * Clears authentication form drafts (login and register), e.g. after successful auth.
   */
  public clearAuthDrafts(): void {
    this.loginDraft.set({});
    this.registerDraft.set({});
  }

  /**
   * Discards authentication drafts. Kept for backwards compatibility with existing auth callers.
   */
  public clearDrafts(): void {
    this.clearAuthDrafts();
  }

  /**
   * Discards all form drafts across the entire application.
   */
  public clearAllDrafts(): void {
    this.clearAuthDrafts();
    this.clearAddTaskDraft();
  }
}

/** Alias for generic usage of the draft service across various feature forms. */
export type FormDraftService = DraftService;
