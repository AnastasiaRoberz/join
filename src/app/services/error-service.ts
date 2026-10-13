import { Service } from '@angular/core';
import { ValidationErrors } from '@angular/forms';

@Service()
export class ErrorService {
  messages: Record<string, (field: string, err: any) => string> = {
    required: (field) => `${field} is required`,
    email: (field) => `Please enter a valid ${field}`,
  };

  getErrorMessage(
    errors: ValidationErrors | null,
    fieldName: string = 'This field',
  ): string | null {
    if (!errors) return null;

    const firstKey = Object.keys(errors)[0];
    const errorMsg = this.messages[firstKey];
    return errorMsg ? errorMsg(fieldName, errors[firstKey]) : 'Invalid input.';
  }
}
