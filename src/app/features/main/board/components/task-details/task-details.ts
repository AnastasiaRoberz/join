import {
  afterRenderEffect,
  Component,
  computed,
  ElementRef,
  inject,
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
import { SubtaskInterface } from '../../../../../interfaces/subtask.interface';
import { TaskInterface } from '../../../../../interfaces/task.interface';

/**
 * Dialog view component that displays the full details of a selected board task,
 * including its category tag, title, collapsible description, due date, priority,
 * expandable assigned contacts, and filterable subtasks.
 *
 * The view is read-only except for the subtask checkboxes: toggling a subtask's `is_done`
 * state is persisted immediately. All other changes are made in `TaskEdit`.
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
  host: {
    '[class.scroll-container]': 'isShortHeight()',
  },
})
export class TaskDetails {
  /** Responsive layout service for breakpoint queries. */
  protected readonly responsiveService = inject(ResponsiveService);

  /** Provides reactive access to task collection and persists subtask status changes. */
  private readonly taskService = inject(TaskService);

  /** Handles confirmation prompts before deleting a task. */
  private readonly confirmService = inject(ConfirmService);

  /** Manages closing detail modal or switching to `task-edit` dialog. */
  protected readonly dialogService = inject(DialogService);

  /** Signal indicating viewports with height <= 600px. */
  protected readonly isShortHeight = this.responsiveService.isMaxHeight(600);

  /** Helper function exposed to template for formatting priority labels. */
  protected readonly capitalizeFirstLetter = capitalizeFirstLetter;

  /** Reference to description paragraph element used to measure text overflow. */
  private readonly container = viewChild<ElementRef<HTMLElement>>('container');

  /** Reference to main scrollable content wrapper inside dialog. */
  private readonly scrollWrapper = viewChild<ElementRef<HTMLElement>>('scrollTop');

  /** Whether the task description is currently expanded to its full height. */
  protected readonly isExpanded = signal<boolean>(false);

  /** Measured full scrollHeight (in px) applied as CSS variable when description is expanded. */
  protected readonly expandedHeight = signal<string | null>(null);

  /** Whether description content overflows the collapsed height and requires a toggle button. */
  protected readonly hasMoreHeight = signal<boolean>(false);

  /** Whether the full vertical list of assigned users is expanded. */
  protected readonly showAllUsers = signal<boolean>(false);

  /** Whether completed (`is_done: true`) subtasks are currently shown in the list. */
  protected readonly showDoneSubtasks = signal<boolean>(false);

  /** Deleting state flag preventing duplicate delete calls. */
  protected readonly isDeleting = signal<boolean>(false);

  /** Reactively resolves the active task from `TaskService` matching dialog selection. */
  protected readonly selectedTask = computed<TaskInterface | undefined>(() => {
    const targetId = this.dialogService.selectedItem()?.id;
    return this.taskService.tasks().find((task) => task.id === targetId);
  });

  /** Whether the task due date is in the past relative to today. */
  protected readonly isOverdue = computed<boolean>(() => {
    const today = new Date().setHours(0, 0, 0, 0);
    const dueDateTask = this.selectedTask();
    if (!dueDateTask) return false;
    const matchingDate = new Date(dueDateTask.due_date).setHours(0, 0, 0, 0);
    return matchingDate < today;
  });

  /** Background color associated with current task's category tag. */
  protected readonly categoryColor = computed<string | undefined>(() => {
    const currentCategory = this.selectedTask()?.category;
    return CATEGORIES.find((cat) => cat.name === currentCategory)?.color;
  });

  /** True if more than 1 user is assigned to the task, enabling expandable avatar view. */
  protected readonly moreUsers = computed<boolean>(
    () => (this.selectedTask()?.assigned_users?.length ?? 0) > 1,
  );

  /** All subtasks of selected task sorted with open ones first and completed last. */
  protected readonly sortedSubtasks = computed<SubtaskInterface[]>(() => {
    const currentSubtasks = this.selectedTask()?.subtasks ?? [];
    return [...currentSubtasks].sort((a, b) => {
      if (a.is_done !== b.is_done) {
        return a.is_done ? 1 : -1;
      }
      return b.id - a.id;
    });
  });

  /** Open subtasks (`is_done === false`) in display order. */
  protected readonly subtasksNotDone = computed<SubtaskInterface[]>(() =>
    this.sortedSubtasks().filter((item) => !item.is_done),
  );

  /** Completed subtasks (`is_done === true`) in display order. */
  protected readonly subtasksDone = computed<SubtaskInterface[]>(() =>
    this.sortedSubtasks().filter((item) => item.is_done),
  );

  /** Subtasks currently rendered in list: all when expanded, otherwise only open ones. */
  protected readonly visibleSubtasks = computed<SubtaskInterface[]>(() =>
    this.showDoneSubtasks() ? this.sortedSubtasks() : this.subtasksNotDone(),
  );

  /** Sets up afterRenderEffect to detect whether task description content overflows container. */
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

  /** Toggles description between collapsed preview height and full scrollHeight. */
  protected toggleDescription(): void {
    const el = this.container()?.nativeElement;
    if (!el) return;

    this.isExpanded.update((v) => !v);
    this.expandedHeight.set(this.isExpanded() ? `${el.scrollHeight}px` : null);
    if (!this.isExpanded()) {
      setTimeout(() => this.scrollToTop());
    }
  }

  /**
   * Toggles assigned users view between compact row and full vertical list.
   *
   * @param element - The container element holding the users list.
   */
  protected toggleUsers(element: HTMLElement): void {
    this.showAllUsers.update((v) => !v);
    if (this.showAllUsers()) {
      setTimeout(() => this.scrollLastUserIntoView(element));
    } else {
      this.scrollToTop();
    }
  }

  /**
   * Toggles visibility of completed subtasks.
   *
   * @param element - The container element holding the subtasks list.
   */
  protected toggleSubtasks(element: HTMLElement): void {
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

  /**
   * Smoothly scrolls dialog content so given section element aligns with top edge.
   *
   * @param element - The DOM element to scroll into view.
   */
  protected scrollToSection(element: HTMLElement): void {
    setTimeout(() => {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  }

  /** Smoothly scrolls dialog content wrapper back to the top. */
  protected scrollToTop(): void {
    setTimeout(() => {
      this.scrollWrapper()?.nativeElement.scrollTo({ behavior: 'smooth', top: 0 });
    });
  }

  /**
   * Persists completion status of a subtask immediately via `TaskService`.
   *
   * @param subtaskId - ID of the subtask to update.
   * @param isDone - Completion state.
   */
  protected async toggleSubtaskStatus(subtaskId: number, isDone: boolean): Promise<void> {
    await this.taskService.updateSubtaskStatus(subtaskId, isDone);
  }

  /**
   * Prompts for confirmation and deletes the task, then closes dialog.
   *
   * @param taskId - ID of the task to delete.
   */
  protected async onDelete(taskId: number): Promise<void> {
    if (this.isDeleting()) return;
    if (!(await this.confirmService.askDelete('Task'))) return;
    this.isDeleting.set(true);
    try {
      await this.taskService.deleteTask(taskId);
      this.dialogService.closeDialog();
    } finally {
      this.isDeleting.set(false);
    }
  }

  /**
   * Scrolls the last assigned user in the list into view if overflowing.
   *
   * @param element - The container element containing avatars.
   */
  private scrollLastUserIntoView(element: HTMLElement): void {
    const container = this.scrollWrapper()?.nativeElement;
    if (!container) return;

    const lastItem = element.querySelector<HTMLElement>('.avatar-wrapper:last-child') ?? element;
    const containerRect = container.getBoundingClientRect();
    const itemRect = lastItem.getBoundingClientRect();

    if (itemRect.bottom > containerRect.bottom) {
      lastItem.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }
}
