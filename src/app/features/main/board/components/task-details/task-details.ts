import {
  afterRenderEffect,
  Component,
  computed,
  ElementRef,
  inject,
  input,
  signal,
  viewChild,
} from '@angular/core';
import { DatePipe } from '@angular/common';
import { TaskService } from '../../../../../services/task.service';
import { DialogService } from '../../../../../services/dialog.service';
import { Buttons } from '../../../../../shared/button.component/button.component';
import { UserAvatar } from '../../../../../shared/user-avatar/user-avatar';
import { CheckboxComponent } from '../../../../../shared/checkbox.component/checkbox.component';
import { capitalizeFirstLetter } from '../../../../../utils/utils';
import { CATEGORIES } from '../../../../../utils/categories-list';
import { ConfirmService } from '../../../../../services/confirm.service';
import { FitTextDirective } from '../../../../../directives/fit-text.directive';

/**
 * Dialog view component that displays the full details of a selected board task,
 * including its category tag, title, description, due date, priority, assigned contacts,
 * and subtasks.
 *
 * The view is read-only except for the subtask checkboxes: toggling a subtask's `is_done`
 * state is persisted immediately (see {@link TaskDetails.toggleSubtaskStatus}). All other
 * changes are made in `TaskEdit`, which is opened via the edit button.
 *
 * It is rendered by `DialogComponent` when `DialogService.dialogType()` is `'task'`:
 *
 * @example
 * ```ts
 * // e.g. from a task card on the board
 * dialogService.openDialog('task', task);
 * ```
 * ```html
 * <app-task-details />
 * ```
 */
@Component({
  imports: [Buttons, DatePipe, FitTextDirective, UserAvatar, CheckboxComponent],
  selector: 'app-task-details',
  styleUrl: './task-details.scss',
  templateUrl: './task-details.html',
})
export class TaskDetails {
  /** Provides reactive access to the task collection and `updateSubtaskStatus()` for persisting subtask toggles. */
  taskService = inject(TaskService);
  confirmService = inject(ConfirmService);

  /** Manages closing the detail modal (close button) or switching to the `task-edit` dialog (edit button). */
  dialogService = inject(DialogService);

  /** Helper function exposed to the template for formatting priority labels. */
  capitalizeFirstLetter = capitalizeFirstLetter;

  collapsedHeight = input<string>('140px');
  isExpanded = signal<boolean>(false);
  container = viewChild<ElementRef<HTMLElement>>('container');
  expandedHeight = signal<string | null>(null);
  hasMoreHeight = signal<boolean>(false);

  constructor() {
    afterRenderEffect(() => {
      const el = this.container()?.nativeElement;
      const maxHeight = parseInt(this.collapsedHeight(), 10);
      this.selectedTask()?.description;

      if (!el || isNaN(maxHeight)) {
        this.hasMoreHeight.set(false);
        return;
      }

      this.hasMoreHeight.set(el.scrollHeight > maxHeight);
    });
  }

  toggleDescription(): void {
    const el = this.container()?.nativeElement;
    if (!el) return;

    this.isExpanded.update((v) => !v);
    this.expandedHeight.set(this.isExpanded() ? `${el.scrollHeight}px` : null);
  }

  // ---------------------------------------------------------------------------
  // Inputs & Computed State
  // ---------------------------------------------------------------------------

  // /**
  //  * Fallback task ID (default `1`) used if no task object was passed via `DialogService.openDialog()`.
  //  * Normally not set, because the dialog container does not bind it.
  //  */
  // selectedId = input<number>(1);

  // /**
  //  * Reactively resolves the full task object from `TaskService` matching the task
  //  * stored in `dialogService.selectedItem()` (or falls back to `selectedId()`).
  //  * Automatically reflects live changes when subtasks or task details are updated.
  //  * Resolves to `undefined` if no matching task exists (the template then renders nothing).
  //  */
  selectedTask = computed(() => {
    const targetId = this.dialogService.selectedItem()?.id;
    return this.taskService.tasks().find((task) => task.id === targetId);
  });

  /**
   * Subtasks of `selectedTask()` in display order (the source array is not mutated):
   * open subtasks first, completed ones last; within each group the newest subtask
   * (highest id) comes first.
   */
  sortedSubtasks = computed(() => {
    const currentSubtasks = this.selectedTask()?.subtasks ?? [];
    return [...currentSubtasks].sort((a, b) => {
      if (a.is_done !== b.is_done) {
        return a.is_done ? 1 : -1;
      }
      return b.id - a.id;
    });
  });

  categoryColor = computed(() => {
    const currentCategory = this.selectedTask()?.category;
    return CATEGORIES.find((cat) => cat.name === currentCategory)?.color;
  });

  // ---------------------------------------------------------------------------
  // Public Methods
  // ---------------------------------------------------------------------------

  /**
   * Persists the completion status (`is_done`) of a single subtask immediately via
   * `TaskService.updateSubtaskStatus`. This is the only change in this view that is saved right away.
   *
   * @param subtaskId - The ID of the subtask being toggled.
   * @param isDone - The new completion state emitted by `<app-checkbox>` (`checkedChange`).
   * @returns A promise that resolves once the update has been completed.
   */
  async toggleSubtaskStatus(subtaskId: number, isDone: boolean): Promise<void> {
    await this.taskService.updateSubtaskStatus(subtaskId, isDone);
  }

  async onDelete(taskId: number): Promise<void> {
    if (!(await this.confirmService.askDelete('Task'))) return;
    await this.taskService.deleteTask(taskId);
    this.dialogService.closeDialog();
  }
}
