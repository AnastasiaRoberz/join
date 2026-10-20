import { Service } from '@angular/core';
import { ValidationErrors } from '@angular/forms';

@Service()
export class ErrorService {
  messages: Record<string, (field: string, err: any) => string> = {
    // --- General Custom Validators ---
    onlyWhitespace: (field) => `${field} can't be only spaces.`,

    invisibleCharacters: (field) => `Invisible or unsupported characters.`,

    forbiddenCharacters: (field) => `Not allowed: < > { } \ `,

    invalidEdgeCharacter: (field) => `${field} can't start or end with . or -`,

    consecutiveSpecials: (field) => `No double spaces, periods or hyphens.`,

    // --- Name Validators ---
    invalidNameChars: (field) => `Only letters, spaces, - and ' allowed.`,

    maxLength: (field, errData?: { requiredLength: number; actualLength: number }) =>
      `Max ${errData?.requiredLength ?? 75} characters.`,

    missingFullName: () => `Please enter first and last name.`,

    invalidPartStructure: () => `Each name part needs a letter.`,

    // --- Mail Validators ---
    invalidMailFormat: () => `Enter a valid email (name@domain.com).`,

    invalidMailDomain: () => `Invalid domain after the @.`,

    uniqueEmail: () => `Email already in use.`,

    // --- Phone Validators ---
    invalidPhoneChars: () => `Only digits, spaces, + - / ( ) allowed.`,

    minPhoneDigits: (_field, errData?: { required: number; actual: number }) =>
      `At least ${errData?.required ?? 6} digits needed.`,

    maxPhoneDigits: (_field, errData?: { required: number; actual: number }) =>
      `Max ${errData?.required ?? 15} digits.`,

    invalidPhoneBrackets: () => `The parentheses do not match / close.`,

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
