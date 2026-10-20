import { Service, signal } from '@angular/core';
import { FeedbackInterface } from '../interfaces/feedback.interface';

@Service()
export class FeedbackService {
  readonly feedbackState = signal<FeedbackInterface>({
    message: '',
    type: 'success',
    visible: false,
  });

  showSuccess(msg: string) {
    this.showMessage(msg, 'success');
  }

  showError(msg: string) {
    this.showMessage(msg, 'error');
  }

  private showMessage(message: string, type: 'success' | 'error'): void {
    this.feedbackState.set({ message, type, visible: true });

    setTimeout(() => {
      this.feedbackState.update((prev) => ({ ...prev, visible: false }));
    }, 4000);
  }
}
