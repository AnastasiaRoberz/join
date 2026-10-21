import { Service, signal } from '@angular/core';
import { ConfirmInterface } from '../interfaces/confirm.interface';

/**
 * Asks the user to confirm an action (e.g. deleting a contact).
 * The confirm dialog is visible as long as `request` is not null.
 */
@Service()
export class ConfirmService {
  request = signal<ConfirmInterface | null>(null);
  resolver: ((confirmed: boolean) => void) | null = null;

  /**
   * Opens the confirm dialog and waits for the answer of the user.
   *
   * @param request - Title, message and label of the confirm button
   * @returns A promise that resolves to `true` (confirmed) or `false` (cancelled)
   */
  ask(request: ConfirmInterface): Promise<boolean> {
    this.resolver?.(false);
    this.request.set(request);
    return new Promise((resolve) => (this.resolver = resolve));
  }

  /**
   * Shortcut for the standard "Do you really want to delete ...?" question.
   *
   * @param type - What is deleted, e.g. `'contact'` or `'task'`
   * @param name - Name of the item that is deleted
   * @returns A promise that resolves to `true` (confirmed) or `false` (cancelled)
   */
  askDelete(type: string, name: string): Promise<boolean> {
    return this.ask({
      title: `Delete ${type}?`,
      message: `Do you really want to delete ${name}? This cannot be undone.`,
      confirmLabel: 'Delete',
    });
  }

  /**
   * Closes the dialog and hands the answer back to the caller of `ask()`.
   *
   * @param confirmed - `true` if the user confirmed, `false` if the user cancelled
   */
  answer(confirmed: boolean): void {
    this.request.set(null);
    this.resolver?.(confirmed);
    this.resolver = null;
  }
}