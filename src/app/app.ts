import { Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { FeedbackService } from './services/feedback.service';
import { FeedbackBanner } from './shared/feedback-banner/feedback-banner';

/**
 * Root application component hosting the global router outlet and feedback banner.
 */
@Component({
  imports: [RouterOutlet, FeedbackBanner],
  selector: 'app-root',
  templateUrl: './app.html',
})
export class App {
  /** Injected service for displaying global feedback toasts. */
  private readonly feedbackService = inject(FeedbackService);

  /** Reactive state of current feedback message, bound to feedback banner in template. */
  protected readonly feedbackState = this.feedbackService.feedbackState;
}
