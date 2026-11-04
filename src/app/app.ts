import { Component, inject, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { FeedbackService } from './services/feedback.service';
import { FeedbackBanner } from './shared/feedback-banner/feedback-banner';

@Component({
  imports: [RouterOutlet, FeedbackBanner],
  selector: 'app-root',
  styleUrl: './app.scss',
  templateUrl: './app.html',
})
export class App {
  protected readonly title = signal('join');
  feedbackService = inject(FeedbackService);
  feedbackState = this.feedbackService.feedbackState;
}
