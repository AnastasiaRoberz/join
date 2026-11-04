import { Component, inject } from '@angular/core';
import { TextField } from '../../../shared/text-field/text-field';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { SupabaseService } from '../../../services/supabase.service';
import { customMailValidator, generalCustomValidators } from '../../../utils/custom-validators';
import { UserService } from '../../../services/user.service';

@Component({
  imports: [TextField, ReactiveFormsModule],
  selector: 'app-register',
  styleUrl: './register.scss',
  templateUrl: './register.html',
})
export class Register {
  privatefb = inject(FormBuilder);
  supabaseService = inject(SupabaseService);
  userService = inject(UserService);

  registerForm = this.privatefb.group({
    name: ['', [generalCustomValidators]],
    mail: ['', [customMailValidator]],
    password: [''],
    confirmPassword: [''],
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
