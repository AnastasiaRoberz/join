import { Component, computed, inject } from '@angular/core';
import { TextField } from '../../../shared/text-field/text-field';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { SupabaseService } from '../../../services/supabase.service';
import {
  customMailValidator,
  customNameValidator,
  generalCustomValidators,
  passwordMatchValidator,
} from '../../../utils/custom-validators';
import { UserService } from '../../../services/user.service';
import { RouterLink } from '@angular/router';
import { Buttons } from '../../../shared/button.component/button.component';
import { CheckboxComponent } from '../../../shared/checkbox.component/checkbox.component';
import { toSignal } from '@angular/core/rxjs-interop';

@Component({
  imports: [TextField, ReactiveFormsModule, Buttons, CheckboxComponent, RouterLink],
  selector: 'app-register',
  styleUrl: './register.scss',
  templateUrl: './register.html',
})
export class Register {
  privatefb = inject(FormBuilder);
  supabaseService = inject(SupabaseService);
  userService = inject(UserService);

  registerForm = this.privatefb.group({
    name: ['', [Validators.required, generalCustomValidators(), customNameValidator()]],
    mail: ['', [Validators.required, customMailValidator(), customMailValidator()]],
    password: ['', [Validators.required]],
    confirmPassword: ['', [Validators.required, passwordMatchValidator()]],
    privacy: [false, [Validators.requiredTrue]],
  });

  passwordValue = toSignal(this.registerForm.controls.password.valueChanges, {
    initialValue: this.registerForm.controls.password.value ?? '',
  });

  passwordRules = computed(() => {
    const pwd = this.passwordValue() ?? '';
    return [
      { label: 'At least 8 characters', valid: pwd.length >= 8 },
      { label: 'At least 1 uppercase letter (A-Z)', valid: /[A-Z]/.test(pwd) },
      { label: 'At least 1 lowercase letter (a-z)', valid: /[a-z]/.test(pwd) },
      { label: 'At least 1 number (0-9)', valid: /[0-9]/.test(pwd) },
      { label: 'At least 1 special character', valid: /[^a-zA-Z0-9]/.test(pwd) },
    ];
  });

  async onSignup(): Promise<void> {
    const rawData = this.registerForm.getRawValue();

    const userData = {
      name: rawData.name!,
      mail: rawData.mail!,
      password: rawData.password!,
    };

    this.userService.userSignUp(userData);
  }
}
