import { Service } from '@angular/core';
import { ValidationErrors } from '@angular/forms';

@Service()
export class ErrorService {
  messages: Record<string, (field: string, err: any) => string> = {
    required: (field) => `Your ${field.toLowerCase()} is required.`,
    email: (field) => `Please enter a valid ${field.toLowerCase()}.`,
    invalidEmail: () => `Please enter a valid email address.`,
    hasNumber: (field) => `Your ${field.toLowerCase()} cannot contain numbers.`,
    invalidPhone: () => `Please enter a valid phone number.`,
    minNames: () => 'Please enter your firstname and your surname.',
  };

  getErrorMessage(errors: ValidationErrors | null, fieldName: string): string | null {
    if (!errors) return null;

    const firstKey = Object.keys(errors)[0];
    console.log('Gemeldeter Error-Key:', firstKey, 'Werte:', errors[firstKey]);
    const errorMsg = this.messages[firstKey];
    return errorMsg ? errorMsg(fieldName, errors[firstKey]) : 'Invalid input.';
  }
}
