import { Service, signal } from '@angular/core';
import { Feedback } from '../interfaces/feedback';

@Service()
export class FeedbackService {
  readonly feedbackState = signal<Feedback>({
    message: '',
    type: 'success',
    visible: false,
  });

  showSuccess(msg: string) {
    this.showMessage(msg, 'success');
    console.log(this.feedbackState());
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
