/** State of the feedback toast (see `FeedbackService`). */
export interface FeedbackInterface {
  message: string;
  type: 'success' | 'error';
  visible: boolean;
}
