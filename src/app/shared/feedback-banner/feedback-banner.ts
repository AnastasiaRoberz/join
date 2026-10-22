import { Component, inject } from '@angular/core';
import { FeedbackService } from '../../services/feedback.service';

@Component({
  imports: [],
  selector: 'app-feedback-banner',
  styleUrl: './feedback-banner.scss',
  templateUrl: './feedback-banner.html',
  host: {
    '[class.is-open]': 'feedback',
  },
})
export class FeedbackBanner {
  feedbackService = inject(FeedbackService);
  feedback = this.feedbackService.feedbackState;
}
