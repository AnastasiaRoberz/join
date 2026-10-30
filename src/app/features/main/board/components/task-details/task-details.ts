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
import { ConfirmService } from '../../../../../services/confirm.service';
import { Buttons } from '../../../../../shared/button.component/button.component';
import { CheckboxComponent } from '../../../../../shared/checkbox.component/checkbox.component';
import { AvatarGroupComponent } from '../../../../../shared/avatar-group.component/avatar-group.component';
import { FitTextDirective } from '../../../../../directives/fit-text.directive';
import { capitalizeFirstLetter } from '../../../../../utils/utils';
import { CATEGORIES } from '../../../../../utils/categories-list';
import { ResponsiveService } from '../../../../../services/responsive.service';

/**
 * Dialog view component that displays the full details of a selected board task,
 * including its category tag, title, collapsible description, due date, priority,
 * expandable assigned contacts, and filterable subtasks.
 *
 * The view is read-only except for the subtask checkboxes: toggling a subtask's `is_done`
 * state is persisted immediately (see {@link TaskDetails.toggleSubtaskStatus}). All other
 * changes are made in `TaskEdit`, which is opened via the edit button.
 *
 * Rendered by `DialogComponent` when `DialogService.dialogType()` is `'task'`.
 *
 * @example
 * ```ts
 * dialogService.openDialog('task', task);
 * ```
 * ```html
 * <app-task-details />
 * ```
 */
@Component({
  imports: [Buttons, DatePipe, FitTextDirective, CheckboxComponent, AvatarGroupComponent],
  selector: 'app-task-details',
  styleUrl: './task-details.scss',
  templateUrl: './task-details.html',
})
export class TaskDetails {
  // ---------------------------------------------------------------------------
  // Injected Services & Helpers
  // ---------------------------------------------------------------------------
  responsiveService = inject(ResponsiveService);

  /** Provides reactive access to the task collection and persists subtask status changes. */
  taskService = inject(TaskService);

  /** Handles confirmation prompts before deleting a task. */
  confirmService = inject(ConfirmService);

  /** Manages closing the detail modal or switching to the `task-edit` dialog. */
  dialogService = inject(DialogService);

  /** Helper function exposed to the template for formatting priority labels. */
  capitalizeFirstLetter = capitalizeFirstLetter;

  // ---------------------------------------------------------------------------
  // Inputs & View Queries
  // ---------------------------------------------------------------------------

  /** Maximum height of the description text in its collapsed state (e.g. `'140px'`). */
  collapsedHeight = input<string>('140px');

  /** Reference to the description paragraph element used to measure text overflow. */
  container = viewChild<ElementRef<HTMLElement>>('container');

  /** Reference to the main scrollable content wrapper inside the dialog. */
  scrollWrapper = viewChild<ElementRef<HTMLElement>>('scrollTop');

  // ---------------------------------------------------------------------------
  // UI State Signals
  // ---------------------------------------------------------------------------

  /** Whether the task description is currently expanded to its full height. */
  isExpanded = signal<boolean>(false);

  /** Measured full scrollHeight (in px) applied as CSS variable when the description is expanded. */
  expandedHeight = signal<string | null>(null);

  /** Whether the description content exceeds `collapsedHeight()` and requires a toggle button. */
  hasMoreHeight = signal<boolean>(false);

  /** Whether the full vertical list of assigned users is expanded (when more than 3 users are assigned). */
  showAllUsers = signal<boolean>(false);

  /** Whether completed (`is_done: true`) subtasks are currently shown in the subtask list. */
  showDoneSubtasks = signal<boolean>(false);

  // ---------------------------------------------------------------------------
  // Computed State
  // ---------------------------------------------------------------------------

  /**
   * Reactively resolves the active task from `TaskService` matching the item selected in `DialogService`.
   * Automatically reflects live updates when subtasks or task details change.
   */
  selectedTask = computed(() => {
    const targetId = this.dialogService.selectedItem()?.id;
    return this.taskService.tasks().find((task) => task.id === targetId);
  });

  /** Background color associated with the current task's category tag. */
  categoryColor = computed(() => {
    const currentCategory = this.selectedTask()?.category;
    return CATEGORIES.find((cat) => cat.name === currentCategory)?.color;
  });

  /** True if more than 3 users are assigned to the task, enabling the compact/expandable avatar view. */
  moreUsers = computed(() => (this.selectedTask()?.assigned_users?.length ?? 0) > 3);

  /**
   * All subtasks of `selectedTask()` sorted for display (without mutating the source array):
   * open subtasks first, completed ones last; within each group newest (highest id) first.
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

  /** Open subtasks (`is_done === false`) in display order. */
  subtasksNotDone = computed(() => this.sortedSubtasks().filter((item) => !item.is_done));

  /** Completed subtasks (`is_done === true`) in display order. */
  subtasksDone = computed(() => this.sortedSubtasks().filter((item) => item.is_done));

  /** Subtasks currently rendered in the list: all subtasks when expanded, otherwise only open ones. */
  visibleSubtasks = computed(() =>
    this.showDoneSubtasks() ? this.sortedSubtasks() : this.subtasksNotDone(),
  );

  // ---------------------------------------------------------------------------
  // Lifecycle
  // ---------------------------------------------------------------------------

  constructor() {
    afterRenderEffect(() => {
      const element = this.container()?.nativeElement;
      this.selectedTask()?.description;

      if (!element) {
        this.hasMoreHeight.set(false);
        return;
      }

      this.hasMoreHeight.set(element.scrollHeight > element.clientHeight + 1);
    });
  }

  // ---------------------------------------------------------------------------
  // UI Interaction & Scroll Methods
  // ---------------------------------------------------------------------------

  /** Toggles the description between its collapsed preview height and full scrollHeight. */
  toggleDescription(): void {
    const el = this.container()?.nativeElement;
    if (!el) return;

    this.isExpanded.update((v) => !v);
    this.expandedHeight.set(this.isExpanded() ? `${el.scrollHeight}px` : null);
    if (!this.isExpanded()) {
      setTimeout(() => this.scrollToTop());
    }
  }

  /**
   * Toggles the assigned users view between the compact avatar row and the full vertical list.
   * Scrolls the users section into view when expanding, or back to the top when collapsing.
   */
  toggleUsers(element: HTMLElement): void {
    this.showAllUsers.update((v) => !v);
    if (this.showAllUsers()) {
      setTimeout(() => element.scrollIntoView({ behavior: 'smooth', block: 'start' }));
    } else {
      this.scrollToTop();
    }
  }

  /**
   * Toggles the visibility of completed subtasks.
   * Scrolls the subtasks section into view when expanding, or back to the top when collapsing.
   */
  toggleSubtasks(element: HTMLElement): void {
    this.showDoneSubtasks.update((v) => !v);
    if (this.showDoneSubtasks()) {
      setTimeout(() => {
        const firstDoneTask = element.querySelector<HTMLElement>('.subtask.done') ?? element;
        firstDoneTask.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
    } else {
      this.scrollToTop();
    }
  }

  /** Smoothly scrolls the dialog content so the given section element aligns with the top edge. */
  scrollToSection(element: HTMLElement): void {
    setTimeout(() => {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  }

  /** Smoothly scrolls the dialog content wrapper back to the very top. */
  scrollToTop(): void {
    setTimeout(() => {
      this.scrollWrapper()?.nativeElement.scrollTo({ behavior: 'smooth', top: 0 });
    });
  }

  // ---------------------------------------------------------------------------
  // Data Persistence Methods
  // ---------------------------------------------------------------------------

  /**
   * Persists the completion status (`is_done`) of a single subtask immediately via
   * `TaskService.updateSubtaskStatus`.
   *
   * @param subtaskId - The ID of the subtask being toggled.
   * @param isDone - The new completion state emitted by `<app-checkbox>`.
   */
  async toggleSubtaskStatus(subtaskId: number, isDone: boolean): Promise<void> {
    await this.taskService.updateSubtaskStatus(subtaskId, isDone);
  }

  /** Prompts for confirmation and deletes the given task, then closes the dialog. */
  async onDelete(taskId: number): Promise<void> {
    if (!(await this.confirmService.askDelete('Task'))) return;
    await this.taskService.deleteTask(taskId);
    this.dialogService.closeDialog();
  }
}
