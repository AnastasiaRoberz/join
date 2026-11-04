import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { SupabaseService } from '../../../services/supabase.service';
import { TextField } from '../../../shared/text-field/text-field';
import { UserService } from '../../../services/user.service';
import { Buttons } from '../../../shared/button.component/button.component';

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

  loginForm = this.privatefb.group({
    mail: ['', [Validators.required]],
    password: ['', [Validators.required]],
  });

  async onLogin(): Promise<void> {
    const rawData = this.loginForm.getRawValue();

    const userData = {
      mail: rawData.mail!,
      password: rawData.password!,
    };

    this.userService.logIn(userData);
    this.loginForm.reset();
  }
}
