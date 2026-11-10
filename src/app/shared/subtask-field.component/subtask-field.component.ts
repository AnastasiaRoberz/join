import {
  Component,
  computed,
  ElementRef,
  inject,
  input,
  model,
  signal,
  viewChild,
} from '@angular/core';
import { ResponsiveService } from '../../services/responsive.service';
import { SubtaskInterface } from '../../interfaces/subtask.interface';
import { Buttons } from '../button.component/button.component';

let nextId = 0;

/**
 * Form field for managing a list of subtasks (add, rename, delete).
 *
 * The component is purely local: it does not know any task or `TaskService` and never touches
 * the database. The parent owns the data and binds it two-way via the `subtasks` model
 * (`[(subtasks)]`); persisting the result is up to the parent (e.g. `TaskEdit.saveTask()`).
 *
 * - New subtasks get a temporary id (`Date.now()`) and are `is_done: false`. Because ids of new
 *   items are larger than existing ones, they appear at the top of the list.
 * - The list is displayed sorted by id descending (newest first).
 * - The `is_done` state is not editable here (this is done in `TaskDetails`).
 *
 * Usage in the UI: type a title into the input and confirm with Enter or the check button
 * (Escape / cancel button clears the input). Double-click or the edit icon switches an entry to
 * edit mode; Enter or the check button saves, Escape cancels, the delete icon removes it.
 *
 * @example
 * ```html
 * <app-subtask-field [(subtasks)]="currentSubtasks" />
 * ```
 */
@Component({
  imports: [Buttons],
  selector: 'app-subtask-field',
  styleUrl: './subtask-field.component.scss',
  templateUrl: './subtask-field.component.html',
})
export class SubtaskFieldComponent {
  /** Responsive service for viewport checks. */
  protected readonly responsiveService = inject(ResponsiveService);

  /** Unique HTML id attribute for the main subtask input element. */
  public readonly fieldId = input<string>(`app-subtask-field-${nextId++}`);

  /** Reference to the primary input element used to add new subtasks. */
  protected readonly mainInput = viewChild<ElementRef<HTMLInputElement>>('mainInput');

  /**
   * The list of subtasks. A `model` signal, so the parent can use two-way binding
   * (`[(subtasks)]`) and every add/rename/delete in this component is propagated back to it.
   * Defaults to an empty list.
   */
  public readonly subtasks = model<SubtaskInterface[]>([]);

  /** Copy of `subtasks()` sorted by id descending (newest first); this is what the template renders. */
  protected readonly sortedSubtasks = computed<SubtaskInterface[]>(() =>
    [...this.subtasks()].sort((a, b) => b.id - a.id),
  );

  /** Id of the subtask currently shown in edit mode, or `null` if none is being edited. */
  protected readonly editingSubtaskId = signal<number | null>(null);

  /** Whether the subtask list has a max height and allows scrolling. */
  public readonly isScrollable = input<boolean>(false);

  /**
   * Clears the main input field and cancels any active subtask editing.
   */
  public reset(): void {
    const input = this.mainInput()?.nativeElement;
    if (input) input.value = '';
    this.editingSubtaskId.set(null);
  }

  /**
   * Adds a new subtask at the beginning of `subtasks` using the trimmed input text,
   * then clears the input. The new subtask gets a temporary id (`Date.now()`) and
   * `is_done: false`. Empty or whitespace-only input is ignored.
   *
   * @param input - The "new subtask" input element holding the title.
   */
  protected saveSubtask(input: HTMLInputElement): void {
    const rawData = input.value.trim();
    if (!rawData) return;

    const newSubtask: SubtaskInterface = {
      id: Date.now(),
      title: rawData,
      is_done: false,
    };
    this.subtasks.update((list) => [newSubtask, ...list]);
    input.value = '';
  }

  /**
   * Renames an existing subtask with the trimmed input text and leaves edit mode.
   * Empty or whitespace-only input is ignored (the subtask stays in edit mode).
   *
   * @param input - The edit input element holding the new title.
   * @param id - The id of the subtask to rename.
   */
  protected updateSubtaskTitle(input: HTMLInputElement, id: number): void {
    const newTitle = input.value.trim();
    if (!newTitle) return;

    this.subtasks.update((list) =>
      list.map((item) => (item.id === id ? { ...item, title: newTitle } : item)),
    );
    this.editingSubtaskId.set(null);
  }

  /**
   * Removes the subtask with the given id from `subtasks` and leaves edit mode.
   * The removal is local only; it is persisted when the parent saves.
   *
   * @param id - The id of the subtask to remove.
   */
  protected deleteSubtask(id: number): void {
    this.subtasks.update((list) => list.filter((item) => item.id !== id));
    this.editingSubtaskId.set(null);
  }

  /**
   * Switches the subtask with the given id into edit mode (shows a text input instead of the title).
   *
   * @param id - The id of the subtask to edit.
   */
  protected editSubtask(id: number): void {
    this.editingSubtaskId.set(id);
  }
}
