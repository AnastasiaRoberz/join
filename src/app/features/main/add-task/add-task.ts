import { Component, computed, inject, OnDestroy, signal, viewChild } from '@angular/core';
import { Buttons } from '../../../shared/button.component/button.component';
import { Priority, PriorityBtn } from '../../../shared/priority-btn/priority-btn';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ContactInterface } from '../../../interfaces/contact.interface';
import { UserAvatar } from '../../../shared/user-avatar/user-avatar';
import { ResponsiveService } from '../../../services/responsive.service';
import { TaskService } from '../../../services/task.service';
import { TaskInterface } from '../../../interfaces/task.interface';
import { TextField } from '../../../shared/text-field/text-field';
import { CalendarFieldComponent } from '../../../shared/calendar-field.component/calendar-field.component';
import { SelectFieldComponent } from '../../../shared/select-field.component/select-field.component';
import { ContactService } from '../../../services/contact.service';
import { CATEGORIES } from '../../../utils/categories-list';
import { CheckboxComponent } from '../../../shared/checkbox.component/checkbox.component';
import { AvatarGroupComponent } from '../../../shared/avatar-group.component/avatar-group.component';
import { SubtaskFieldComponent } from '../../../shared/subtask-field.component/subtask-field.component';
import { DialogService } from '../../../services/dialog.service';
import { Router } from '@angular/router';
import { SubtaskInterface } from '../../../interfaces/subtask.interface';
import { CdkScrollable } from '@angular/cdk/scrolling';
import { generalCustomValidators } from '../../../utils/custom-validators';
import { UserService } from '../../../services/user.service';

/**
 * Form component for creating a new task.
 *
 * Collects title, description, due date, priority, category, subtasks, and assigned contacts.
 * On submit, the task is saved via `TaskService`, assignments and subtasks are linked,
 * and the form closes or redirects to the board.
 */
@Component({
  imports: [
    Buttons,
    PriorityBtn,
    ReactiveFormsModule,
    UserAvatar,
    TextField,
    CalendarFieldComponent,
    SelectFieldComponent,
    CheckboxComponent,
    AvatarGroupComponent,
    SubtaskFieldComponent,
    CdkScrollable,
  ],
  selector: 'article[app-add-task]',
  styleUrl: './add-task.scss',
  templateUrl: './add-task.html',
  hostDirectives: [CdkScrollable],
  host: {
    '[class.scroll-container]': 'isShortHeight()',
  },
})
export class AddTask implements OnDestroy {
  /** Responsive layout service for breakpoint queries. */
  protected readonly responsiveService = inject(ResponsiveService);

  /** User service providing assignable contacts for assignment dropdown. */
  protected readonly userService = inject(UserService);

  /** Contact service providing contact sorting and data. */
  private readonly contactService = inject(ContactService);

  /** Task service used to create tasks and manage column status. */
  private readonly taskService = inject(TaskService);

  /** Dialog service for modal add-task workflows. */
  private readonly dialogService = inject(DialogService);

  /** Router instance for navigation to board after standalone submission. */
  private readonly router = inject(Router);

  /** Reference to subtask field child component for resetting input state. */
  private readonly subtaskField = viewChild(SubtaskFieldComponent);

  /** Signal indicating mobile or landscape viewport orientation. */
  protected readonly isMobileOrLandscape = this.responsiveService.isMobileOrLandscape;

  /** Signal indicating middle viewport heights between 501px and 700px. */
  protected readonly isMiddleHeight = this.responsiveService.observeQuery(
    '(min-height: 501px) and (max-height: 700px)',
  );

  /** Signal indicating short viewport heights <= 500px. */
  protected readonly isShortHeight = this.responsiveService.isMaxHeight(500);

  /** Signal indicating tablet special viewports. */
  protected readonly isTabletSpecialHeight = this.responsiveService.observeQuery(
    '(min-width: 769px) and (max-width: 1024px) and (min-height: 701px)',
  );

  /** Static categories list available for task classification. */
  protected readonly categories = CATEGORIES;

  /** Category key extractor function for SelectField. */
  protected readonly categoryKey = (category: (typeof CATEGORIES)[number]): string => category.name;

  /** Priority selected via priority buttons, defaults to `'medium'`. */
  public readonly selectedPrio = signal<Priority>('medium');

  /** Reactive list of currently assigned contact IDs. */
  public readonly selectedContactIds = signal<number[]>([]);

  /** Reactive list of created subtasks. */
  public readonly createdSubtasks = signal<SubtaskInterface[]>([]);

  /** Submission state flag to prevent concurrent duplicate task creation. */
  protected readonly isSubmitting = signal<boolean>(false);

  /** Reactive form holding task fields. */
  protected readonly taskForm = new FormGroup({
    title: new FormControl('', [
      Validators.required,
      Validators.maxLength(200),
      generalCustomValidators(),
    ]),
    description: new FormControl(''),
    date: new FormControl('', Validators.required),
    priority: new FormControl(''),
    assigned: new FormControl<number[]>([]),
    category: new FormControl('', Validators.required),
  });

  /** Full contact objects matching `selectedContactIds()`. */
  protected readonly selectedContacts = computed(() => {
    const ids = new Set(this.selectedContactIds());
    return this.contactService.sortedContacts().filter((contact) => ids.has(contact.id));
  });

  /** Search strings extractor for filtering contacts by first and last name. */
  protected readonly contactSearchStrings = (contact: ContactInterface): string[] => [
    contact.firstname,
    contact.surname,
  ];

  /**
   * Updates assigned contact IDs and marks form control dirty.
   *
   * @param ids - List of selected contact IDs.
   */
  protected onAssignmentChange(ids: number[]): void {
    this.selectedContactIds.set(ids);
    this.taskForm.controls.assigned.setValue(ids);
    this.taskForm.controls.assigned.markAsDirty();
  }

  /**
   * Toggles assignment for a single contact.
   *
   * @param contactId - ID of the contact to toggle.
   * @param isAssigned - Whether the contact should be assigned.
   */
  protected toggleAssignment(contactId: number, isAssigned: boolean): void {
    const currentIds = this.selectedContactIds();
    const updatedIds = isAssigned
      ? currentIds.includes(contactId)
        ? currentIds
        : [...currentIds, contactId]
      : currentIds.filter((id) => id !== contactId);

    this.onAssignmentChange(updatedIds);
  }

  /** Resets the form and all selection signals to initial state. */
  protected onClear(): void {
    this.taskForm.reset();
    this.selectedPrio.set('medium');
    this.selectedContactIds.set([]);
    this.createdSubtasks.set([]);
    this.subtaskField()?.reset();
  }

  /** Submits the form, creates the task, and sets assignments and subtasks. */
  protected async onSubmit(): Promise<void> {
    if (this.taskForm.invalid) {
      this.taskForm.markAllAsTouched();
      return;
    }
    if (this.isSubmitting()) return;

    this.isSubmitting.set(true);
    try {
      const top = this.getNextTopPosition(this.taskService.addTaskStatus());
      const newTask = await this.taskService.addTask(this.buildNewTaskPayload(top));
      if (newTask) await this.saveTaskRelationsAndFinalize(newTask.id);
    } finally {
      this.isSubmitting.set(false);
    }
  }

  /** Resets column status to default 'To do' when navigating away. */
  public ngOnDestroy(): void {
    this.taskService.addTaskStatus.set('To do');
  }

  /**
   * Calculates position value one above existing tasks in the target column.
   *
   * @param status - The column status.
   * @returns Next top position number.
   */
  private getNextTopPosition(status: TaskInterface['status']): number {
    const columnTasks = this.taskService.tasks().filter((task) => task.status === status);
    return columnTasks.length ? Math.min(...columnTasks.map((t) => t.position)) - 1 : 0;
  }

  /**
   * Constructs the task database record payload from form state.
   *
   * @param top - Position index.
   * @returns Task record payload.
   */
  private buildNewTaskPayload(top: number): Omit<TaskInterface, 'id' | 'assigned_users' | 'subtasks'> {
    return {
      title: this.taskForm.value.title!,
      description: this.taskForm.value.description ?? '',
      due_date: this.taskForm.value.date!,
      priority: this.selectedPrio(),
      category: this.taskForm.value.category! as 'User Story' | 'Technical Task',
      status: this.taskService.addTaskStatus(),
      position: top,
    };
  }

  /**
   * Persists task assignments and subtasks, resets form, and routes back to board.
   *
   * @param newTaskId - ID of the newly created task.
   */
  private async saveTaskRelationsAndFinalize(newTaskId: number): Promise<void> {
    const contactIds = this.selectedContactIds();
    const subtasks = this.createdSubtasks();
    await this.taskService.setTaskAssignments(newTaskId, contactIds);
    await this.taskService.setTaskSubtasks(newTaskId, subtasks);
    this.onClear();
    this.returnToBoard();
  }

  /** Closes add-task modal or routes to board page. */
  private returnToBoard(): void {
    const inDialog = this.dialogService.isOpen() && this.dialogService.dialogType() === 'add-task';
    if (inDialog) {
      this.dialogService.closeDialog();
    } else {
      this.router.navigate(['/app/board']);
    }
  }
}
