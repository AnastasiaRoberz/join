import { Component, inject, OnDestroy, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { TextField } from '../../../shared/text-field/text-field';
import { UserService } from '../../../services/user.service';
import { Buttons } from '../../../shared/button.component/button.component';
import { DraftService } from '../../../services/draft.service';

/**
 * Login view component for email/password and anonymous guest sign-in.
 */
@Component({
  imports: [TextField, ReactiveFormsModule, Buttons],
  selector: 'app-login',
  styleUrl: './login.scss',
  templateUrl: './login.html',
})
export class Login implements OnDestroy {
  /** Form builder instance for reactive login form construction. */
  private readonly fb = inject(FormBuilder);

  /** User service handling authentication API requests and session tracking. */
  private readonly userService = inject(UserService);

  /** Draft service preserving typed email input across route transitions. */
  private readonly draftService = inject(DraftService);

  /** Prevents ngOnDestroy from re-saving the email draft after a login redirect. */
  private skipDraftService = false;

  /** Submitting state flag preventing duplicate login requests. */
  protected readonly isSubmitting = signal<boolean>(false);

  /** Reactive login form group with email and password fields. */
  protected readonly loginForm = this.fb.group({
    mail: [this.draftService.loginDraft().mail ?? '', [Validators.required]],
    password: ['', [Validators.required]],
  });

  /** Saves email input to draft service on component destroy. */
  public ngOnDestroy(): void {
    if (this.skipDraftService) return;
    const rawData = this.loginForm.getRawValue();
    this.draftService.loginDraft.set({
      mail: rawData.mail ?? '',
    });
  }

  /**
   * Authenticates user with entered email and password credentials.
   */
  protected async onLogin(): Promise<void> {
    if (this.isSubmitting() || !this.loginForm.valid) return;
    this.isSubmitting.set(true);
    try {
      const rawData = this.loginForm.getRawValue();
      const success = await this.userService.logIn({
        mail: rawData.mail!,
        password: rawData.password!,
      });
      if (!success) return this.handleInvalidCredentials();
      this.skipDraftService = true;
      this.draftService.clearDrafts();
      this.loginForm.reset();
    } finally {
      this.isSubmitting.set(false);
    }
  }

  /**
   * Logs in anonymously as a guest user.
   */
  protected async anonymLogin(): Promise<void> {
    if (this.isSubmitting()) return;
    this.isSubmitting.set(true);
    try {
      this.skipDraftService = true;
      this.draftService.clearDrafts();
      this.loginForm.reset();
      await this.userService.logIn();
    } finally {
      this.isSubmitting.set(false);
    }
  }

  /**
   * Clears the password input and sets an invalid credentials error on failed login.
   */
  private handleInvalidCredentials(): void {
    const passwordCtrl = this.loginForm.get('password');
    passwordCtrl?.setValue('');
    passwordCtrl?.setErrors({ invalidCredentials: true });
    passwordCtrl?.markAsTouched();
  }
}
