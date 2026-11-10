import { Component, computed, inject, OnDestroy, signal } from '@angular/core';
import { TextField } from '../../../shared/text-field/text-field';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import {
  customMailValidator,
  customNameValidator,
  customPasswordValidator,
  generalCustomValidators,
  passwordMatchValidator,
} from '../../../utils/custom-validators';
import { UserService } from '../../../services/user.service';
import { RouterLink } from '@angular/router';
import { Buttons } from '../../../shared/button.component/button.component';
import { CheckboxComponent } from '../../../shared/checkbox.component/checkbox.component';
import { toSignal } from '@angular/core/rxjs-interop';
import { AuthDraftService } from '../../../services/auth-draft.service';

/** Status of an individual password strength rule. */
export interface PasswordRule {
  label: string;
  valid: boolean;
}

/**
 * Registration view component for new user account sign-up.
 */
@Component({
  imports: [TextField, ReactiveFormsModule, Buttons, CheckboxComponent, RouterLink],
  selector: 'app-register',
  styleUrl: './register.scss',
  templateUrl: './register.html',
})
export class Register implements OnDestroy {
  /** Form builder instance for registration form group construction. */
  private readonly fb = inject(FormBuilder);

  /** User service handling registration API requests. */
  private readonly userService = inject(UserService);

  /** Draft service preserving typed name and email across route switches. */
  private readonly draftService = inject(AuthDraftService);

  /** Prevents ngOnDestroy from re-saving the email draft after a login redirect. */
  private skipDraftService = false;

  /** Submitting state flag preventing duplicate sign-up submissions. */
  protected readonly isSubmitting = signal<boolean>(false);

  /** Reactive registration form group with validation constraints. */
  protected readonly registerForm = this.fb.group({
    name: [
      this.draftService.registerDraft().name ?? '',
      [Validators.required, generalCustomValidators(), customNameValidator()],
    ],
    mail: [
      this.draftService.registerDraft().mail ?? '',
      [Validators.required, customMailValidator()],
    ],
    password: ['', [Validators.required, customPasswordValidator()]],
    confirmPassword: ['', [Validators.required, passwordMatchValidator()]],
    privacy: [false, [Validators.requiredTrue]],
  });

  /** Saves entered name and email to draft service on component destroy. */
  public ngOnDestroy(): void {
    const rawData = this.registerForm.getRawValue();
    this.draftService.registerDraft.set({
      name: rawData.name ?? '',
      mail: rawData.mail ?? '',
    });
  }

  /** Reactive signal tracking current password input text. */
  private readonly passwordValue = toSignal(this.registerForm.controls.password.valueChanges, {
    initialValue: this.registerForm.controls.password.value ?? '',
  });

  /** Computed list of password criteria states for tooltip display. */
  protected readonly passwordRules = computed<PasswordRule[]>(() => {
    const pwd = this.passwordValue() ?? '';
    return [
      { label: 'At least 8 characters', valid: pwd.length >= 8 },
      { label: 'At least 1 uppercase letter (A-Z)', valid: /[A-Z]/.test(pwd) },
      { label: 'At least 1 lowercase letter (a-z)', valid: /[a-z]/.test(pwd) },
      { label: 'At least 1 number (0-9)', valid: /[0-9]/.test(pwd) },
      { label: 'At least 1 special character', valid: /[^a-zA-Z0-9]/.test(pwd) },
    ];
  });

  /** Visibility flag for password rules tooltip. */
  protected readonly tooltipVisible = signal<boolean>(false);

  /** Shows the password requirements tooltip. */
  protected showTooltip(): void {
    this.tooltipVisible.set(true);
  }

  /** Hides the password requirements tooltip. */
  protected hideTooltip(): void {
    this.tooltipVisible.set(false);
  }

  /** Toggles the password requirements tooltip visibility. */
  protected toggleTooltip(): void {
    this.tooltipVisible.update((v) => !v);
  }

  /** Submits registration data to create a new user account. */
  protected async onSignup(): Promise<void> {
    if (this.isSubmitting() || !this.registerForm.valid) return;
    this.isSubmitting.set(true);
    try {
      const success = await this.userService.userSignUp(this.getSignUpPayload());
      if (success) {
        this.skipDraftService = true;
        this.draftService.clearDrafts();
        this.registerForm.reset();
      }
    } finally {
      this.isSubmitting.set(false);
    }
  }

  /** Extracts form field values into user sign-up payload. */
  private getSignUpPayload(): { name: string; mail: string; password: string } {
    const rawData = this.registerForm.getRawValue();
    return {
      name: rawData.name!,
      mail: rawData.mail!,
      password: rawData.password!,
    };
  }
}
