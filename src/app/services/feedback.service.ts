import { Service, signal } from '@angular/core';
import { FeedbackInterface } from '../interfaces/feedback.interface';

/**
 * Central service for short success/error messages (toasts).
 *
 * It only holds the state; rendering is done by {@link FeedbackBanner}. Typically called after
 * database operations (e.g. by `SupabaseService`). A message is visible for 2.5 seconds.
 *
 * @example
 * feedback = inject(FeedbackService);
 * this.feedback.showSuccess('Task added to board');
 * this.feedback.showError('Could not save contact');
 */
@Service()
export class FeedbackService {
  /** Current feedback: `message` text, `type` (`'success'` | `'error'`) and `visible` flag. Read-only for consumers; changed via the show methods. */
  public readonly feedbackState = signal<FeedbackInterface>({
    message: '',
    type: 'success',
    visible: false,
  });

  /**
   * Shows a success message (default color) for 2.5 seconds.
   *
   * @param msg - Text to display.
   */
  public showSuccess(msg: string): void {
    this.showMessage(msg, 'success');
  }

  /**
   * Shows an error message (error color) for 2.5 seconds.
   *
   * @param msg - Text to display.
   */
  public showError(msg: string): void {
    this.showMessage(msg, 'error');
  }

  /** Active timer ID for hiding the banner, cancelled when a new toast is shown. */
  private hideTimeout?: ReturnType<typeof setTimeout>;

  /**
   * Sets the feedback state to visible and hides it again after 2.5 seconds. The text and type
   * stay in the state after hiding, so the banner can fade out without its content disappearing.
   * Cancels any pending hide timer so each message gets the full display duration.
   *
   * @param message - Text to display.
   * @param type - Determines the banner styling.
   */
  private showMessage(message: string, type: 'success' | 'error'): void {
    if (this.hideTimeout) clearTimeout(this.hideTimeout);
    this.feedbackState.set({ message, type, visible: true });

    this.hideTimeout = setTimeout(() => {
      this.feedbackState.update((prev) => ({ ...prev, visible: false }));
    }, 2500);
  }
}
