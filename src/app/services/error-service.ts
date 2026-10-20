import { Service } from '@angular/core';
import { ValidationErrors } from '@angular/forms';

@Service()
export class ErrorService {
  messages: Record<string, (field: string, err: any) => string> = {
    // --- General Custom Validators ---
    onlyWhitespace: (field) => `Your ${field} cannot consist only of spaces.`,

    invisibleCharacters: (field) => `Your ${field} contains invisible or unsupported characters.`,

    forbiddenCharacters: (field) =>
      `Your ${field} contains invalid special characters (such as <, >, {, }, or \\).`,

    invalidEdgeCharacter: (field) => `Your ${field} cannot start or end with a period or hyphen.`,

    consecutiveSpecials: (field) =>
      `Your ${field} cannot contain consecutive spaces, periods, or hyphens.`,

    // --- Name Validators ---
    invalidNameChars: (field) =>
      `Your ${field} can only contain letters, spaces, hyphens, and apostrophes.`,

    maxLength: (field, errData?: { requiredLength: number; actualLength: number }) =>
      `Your ${field} cannot exceed ${errData?.requiredLength ?? 75} characters.`,

    missingFullName: () => `Please enter both a first name and a last name.`,

    invalidPartStructure: () => `Each part of the name must contain at least one letter.`,

    // --- Mail Validators ---
    invalidMailFormat: () => `Please enter a valid email address (e.g. name@domain.com).`,

    invalidMailDomain: () => `The domain part of your email address is not valid.`,

    uniqueEmail: () => `This email address is already in use.`,

    // --- Phone Validators ---
    invalidPhoneChars: () =>
      `Please enter a valid phone number. Allowed characters are numbers, spaces, +, -, /, and brackets.`,

    minPhoneDigits: (_field, errData?: { required: number; actual: number }) =>
      `Phone number must contain at least ${errData?.required ?? 6} digits.`,

    maxPhoneDigits: (_field, errData?: { required: number; actual: number }) =>
      `Phone number cannot exceed ${errData?.required ?? 15} digits.`,

    invalidPhoneBrackets: () =>
      `The parentheses in your phone number are not properly matched or closed.`,

    // --- Angular Standard Validator (falls du required nutzt) ---
    required: (field) => `Your ${field} is required.`,
  };

  getErrorMessage(errors: ValidationErrors | null, fieldName: string): string | null {
    if (!errors) return null;

    const firstKey = Object.keys(errors)[0];
    const errorMsg = this.messages[firstKey];
    return errorMsg ? errorMsg(fieldName, errors[firstKey]) : 'Invalid input.';
  }
}
