import {
  afterNextRender,
  Component,
  effect,
  ElementRef,
  inject,
  Injector,
  viewChild,
} from '@angular/core';
import { ConfirmService } from '../../services/confirm.service';
import { Buttons } from '../button.component/button.component';

/**
 * Overlay with a question and two buttons (cancel / confirm).
 * Is controlled by the `ConfirmService`, so it only needs to be placed once in the app.
 *
 * @example
 * <app-confirm-dialog />
 */
@Component({
  imports: [Buttons],
  selector: 'app-confirm-dialog',
  styleUrl: './confirm-dialog.scss',
  templateUrl: './confirm-dialog.html',
})
export class ConfirmDialog {
  /** Service providing the confirmation request state and answer callbacks. */
  protected readonly confirmService = inject(ConfirmService);

  /** Injector required to schedule afterNextRender callbacks inside reactive effects. */
  private readonly injector = inject(Injector);

  /** Reference to the dialog section element in the template for accessibility focus. */
  protected readonly dialogBox = viewChild<ElementRef<HTMLElement>>('dialogBox');

  constructor() {
    this.initFocusEffect();
  }

  /**
   * Sets focus to the dialog box once the confirmation prompt opens.
   */
  private initFocusEffect(): void {
    effect(() => {
      if (this.confirmService.request()) {
        afterNextRender(
          () => {
            this.dialogBox()?.nativeElement.focus();
          },
          { injector: this.injector },
        );
      }
    });
  }
}
