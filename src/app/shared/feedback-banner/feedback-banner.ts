import { Component, inject } from '@angular/core';
import { FeedbackService } from '../../services/feedback.service';

/**
 * Toast-style banner that displays the current success/error message of the
 * {@link FeedbackService}.
 *
 * The component is purely presentational: it never sets the feedback itself, it only
 * renders `FeedbackService.feedbackState`. The message text is shown inside the toast
 * and the feedback type (`'success'` | `'error'`) is applied as a CSS class, so errors
 * get a different background color.
 *
 * The banner is always present in the DOM. Showing/hiding is done purely via CSS: the
 * host element needs the class `is-open`, which the parent binds to the `visible` flag
 * of the feedback state (the service resets this flag automatically after 2.5 seconds).
 * Place it once globally (see `app.html`), not in individual pages.
 *
 * @example
 * <!-- app.html -->
 * <app-feedback-banner [class.is-open]="feedbackState().visible"></app-feedback-banner>
 *
 * @example
 * // trigger a message from anywhere in the app
 * inject(FeedbackService).showSuccess('Contact successfully created');
 */
@Component({
  imports: [],
  selector: 'app-feedback-banner',
  styleUrl: './feedback-banner.scss',
  templateUrl: './feedback-banner.html',
})
export class FeedbackBanner {
  /** Service that owns the feedback state rendered by this banner. */
  feedbackService = inject(FeedbackService);
  /** Signal with the current feedback (`message`, `type`, `visible`); read in the template via `feedback()`. */
  feedback = this.feedbackService.feedbackState;
}
