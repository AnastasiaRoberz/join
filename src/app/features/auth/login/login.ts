import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { SupabaseService } from '../../../services/supabase.service';
import { TextField } from '../../../shared/text-field/text-field';
import { UserService } from '../../../services/user.service';
import { Buttons } from '../../../shared/button.component/button.component';
import { AuthDraftService } from '../../../services/auth-draft.service';

@Component({
  imports: [TextField, ReactiveFormsModule, Buttons],
  selector: 'app-login',
  styleUrl: './login.scss',
  templateUrl: './login.html',
})
export class Login {
  fb = inject(FormBuilder);
  supabaseService = inject(SupabaseService);
  userService = inject(UserService);
  draftService = inject(AuthDraftService);

  loginForm = this.fb.group({
    mail: [this.draftService.loginDraft().mail ?? '', [Validators.required]],
    password: ['', [Validators.required]],
  });

  ngOnDestroy(): void {
    const rawData = this.loginForm.getRawValue();
    this.draftService.loginDraft.set({
      mail: rawData.mail ?? '',
    });
  }

  async onLogin(): Promise<void> {
    if (!this.loginForm.valid) return;
    const rawData = this.loginForm.getRawValue();

    const userData = {
      mail: rawData.mail!,
      password: rawData.password!,
    };

    const success = await this.userService.logIn(userData);

    if (!success) {
      const passwordCtrl = this.loginForm.get('password');
      passwordCtrl?.setValue('');
      this.loginForm.get('password')?.setErrors({ invalidCredentials: true });
      this.loginForm.get('password')?.markAsTouched();
      return;
    }
    this.draftService.clearDrafts();
    this.loginForm.reset();
  }

  async anonymLogin(): Promise<void> {
    await this.userService.logIn();
    this.draftService.clearDrafts();
  }
}
