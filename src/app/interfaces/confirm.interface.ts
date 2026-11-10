/** Content of a confirm dialog (see `ConfirmService`). */
export interface ConfirmInterface {
  /** Heading of the dialog, e.g. "Delete Task?". */
  title: string;
  /** Explanatory text below the heading. */
  message: string;
  /** Label of the confirm button, e.g. "Delete". */
  confirmLabel: string;
}
