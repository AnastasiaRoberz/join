import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

export class CustomValidators {
  static onlyLetters(): ValidatorFn {
    const lettersRegex = /^[\p{L}\s'-]+$/u;

    return (control: AbstractControl): ValidationErrors | null => {
      if (!control.value) return null;

      const isValid = lettersRegex.test(control.value);
      return isValid ? null : { onlyLetters: true };
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
    const phoneRegex = /^\+?[0-9\s\()]{6,20}$/;

    return (control: AbstractControl): ValidationErrors | null => {
      const value = control.value;
      if (!control.value) return null;

      const onlyDigits = value.replace(/\D/g, '');
      const pattern = phoneRegex.test(value.trim());
      const validDigitsCount = onlyDigits.length >= 6 && onlyDigits.length <= 15;

      return pattern && validDigitsCount ? null : { invalidPhone: true };
    };
  }

  static twoNames(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      if (!control.value) return null;

      const wordsCount = control.value
        .trim()
        .split(/\s/)
        .filter((word: any) => word.length >= 2);
      return wordsCount.length >= 2 ? null : { minNames: true };
    };
  }
}
