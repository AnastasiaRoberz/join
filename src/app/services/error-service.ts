import { Service } from '@angular/core';
import { ValidationErrors } from '@angular/forms';

@Service()
export class ErrorService {
  messages: Record<string, (field: string, err: any) => string> = {
    required: (field) => `Your ${field.toLowerCase()} is required.`,

    invalidSpecials: (field) =>
      `Your ${field} cannot contain consecutive special characters or whitespaces.`,
    onlyWhitespace: (field) => `Your ${field} cannot consist only of spaces.`,

    invalidChars: () => 'Your name can only contain letters, a . or a -.',
    minNames: () => 'Please enter your firstname and your surname.',
    invalidMail: () => `Please enter a valid email address.`,
    uniqueEmail: () => 'There is already a contact with that email address.',
    email: () => `Please enter a valid email address.`,
    invalidPhone: () => `Please enter a valid phone number.`,
  };

  getErrorMessage(errors: ValidationErrors | null, fieldName: string): string | null {
    if (!errors) return null;

    const firstKey = Object.keys(errors)[0];
    const errorMsg = this.messages[firstKey];
    return errorMsg ? errorMsg(fieldName, errors[firstKey]) : 'Invalid input.';
  }
}
