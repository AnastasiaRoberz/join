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
  privatefb = inject(FormBuilder);
  supabaseService = inject(SupabaseService);
  userService = inject(UserService);
  draftService = inject(AuthDraftService);

  loginForm = this.privatefb.group({
    mail: [this.draftService.loginDraft().mail ?? '', [Validators.required]],
    password: [this.draftService.loginDraft().password ?? '', [Validators.required]],
  });

  ngOnDestroy(): void {
    const rawData = this.loginForm.getRawValue();
    this.draftService.loginDraft.set({
      mail: rawData.mail ?? '',
      password: rawData.password ?? '',
    });
  }

  async onLogin(): Promise<void> {
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
    this.draftService.clearLogin();
    this.loginForm.reset();
  }
}
