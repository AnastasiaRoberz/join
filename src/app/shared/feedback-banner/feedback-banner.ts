import { Component, inject } from '@angular/core';
import { FeedbackService } from '../../services/feedback.service';

@Component({
  imports: [],
  selector: 'app-feedback-banner',
  styleUrl: './feedback-banner.scss',
  templateUrl: './feedback-banner.html',
})
export class FeedbackBanner {
  feedbackService = inject(FeedbackService);
  feedback = this.feedbackService.feedbackState;
}
