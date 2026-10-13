import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

export class CustomValidators {
  static noNumbers(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      if (!control.value) return null;

      const hasNum = /\d/.test(control.value);
      return hasNum ? { hasNumber: true } : null;
    };
  }

  static customEmail(): ValidatorFn {
    const mailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

    return (control: AbstractControl): ValidationErrors | null => {
      if (!control.value) return null;

      const isValid = mailRegex.test(control.value.trim());
      return isValid ? null : { invalidEmail: true };
    };
  }

  static phone(): ValidatorFn {
    const phoneRegex = /^\+?[0-9\s\-/()]{6,20}$/;

    return (control: AbstractControl): ValidationErrors | null => {
      const value = control.value;
      if (!value) return null;

      const onlyDigits = value.replace(/\D/g, '');
      const pattern = phoneRegex.test(value.trim());
      const validDigitsCount = onlyDigits.length >= 6 && onlyDigits.length <= 15;

      return pattern && validDigitsCount ? null : { invalidPhone: true };
    };
  }
}
