import { Service, signal } from '@angular/core';
import { ConfirmInterface } from '../interfaces/confirm.interface';

/**
 * Asks the user to confirm an action (e.g. deleting a contact or discarding unsaved form entries).
 * The confirm dialog is visible as long as `request` is not null.
 */
@Service()
export class ConfirmService {
  /** The open question, or `null` while no confirm dialog is shown. */
  public readonly request = signal<ConfirmInterface | null>(null);

  /** Resolves the promise returned by `ask()` with the answer of the user. */
  private resolver: ((confirmed: boolean) => void) | null = null;

  /**
   * Opens the confirm dialog and waits for the answer of the user.
   *
   * @param request - Title, message and label of the confirm button
   * @returns A promise that resolves to `true` (confirmed) or `false` (cancelled)
   */
  public ask(request: ConfirmInterface): Promise<boolean> {
    this.resolver?.(false);
    this.request.set(request);
    return new Promise((resolve) => (this.resolver = resolve));
  }

  /**
   * Shortcut for the standard delete question: "Delete <type>" and "This cannot be undone!".
   *
   * @param type - What is deleted, e.g. `'Contact'` or `'Task'`
   * @returns A promise that resolves to `true` (confirmed) or `false` (cancelled)
   */
  public askDelete(type: string): Promise<boolean> {
    return this.ask({
      title: `Delete ${type}?`,
      message: 'This cannot be undone!',
      confirmLabel: 'Delete',
    });
  }

  /**
   * Asks the user whether to leave the Add Task page and discard unsaved form entries.
   *
   * @returns A promise resolving to `true` if discarded, or `false` to continue editing.
   */
  public askDiscardTask(): Promise<boolean> {
    return this.ask({
      title: 'Leave page?',
      message: 'Do you want to leave this page and discard the entries, or continue editing the task?',
      confirmLabel: 'Discard',
    });
  }

  /**
   * Asks the user whether to discard task entries and log out.
   *
   * @returns A promise resolving to `true` to discard and log out, or `false` to continue editing.
   */
  public askLogoutWithUnsavedTask(): Promise<boolean> {
    return this.ask({
      title: 'Discard changes and log out?',
      message: 'Do you want to discard your changes and log out, or continue editing the task?',
      confirmLabel: 'Log out',
    });
  }

  /**
   * Closes the dialog and hands the answer back to the caller of `ask()`.
   *
   * @param confirmed - `true` if the user confirmed, `false` if the user cancelled
   */
  public answer(confirmed: boolean): void {
    this.request.set(null);
    this.resolver?.(confirmed);
    this.resolver = null;
  }
}
