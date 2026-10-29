import { Service } from '@angular/core';
import { ValidationErrors } from '@angular/forms';

/**
 * Translates Angular form validation errors into short, user-facing messages.
 *
 * The keys of {@link ErrorService.messages} must match the error keys returned by the validators
 * (both Angular's built-in ones like `required` and the app's custom validators). It is used by
 * {@link TextField} to display the error of a touched, invalid control.
 *
 * To support a new validator error, add an entry to `messages` with the same key.
 *
 * @example
 * errorService.getErrorMessage({ required: true }, 'Name'); // "Your Name is required."
 */
@Service()
export class ErrorService {
  /**
   * Maps a validation error key to a function that builds the message.
   * The function receives the field label and the error data of the validator
   * (e.g. `{ requiredLength, actualLength }` for `maxLength`).
   */
  messages: Record<string, (field: string, err: any) => string> = {
    // --- General Custom Validators ---
    onlyWhitespace: (field) => `${field} can't be only spaces.`,

    invisibleCharacters: () => `Invisible or unsupported characters.`,

    forbiddenCharacters: () => `Not allowed: < > { } \\ `,

    invalidEdgeCharacter: (field) => `${field} can't start or end with . or -`,

    consecutiveSpecials: () => `No double spaces, periods or hyphens.`,

    // --- Name Validators ---
    invalidNameChars: () => `Only letters, spaces, - and ' allowed.`,

    maxLength: (_field, errData?: { requiredLength: number; actualLength: number }) =>
      `Max ${errData?.requiredLength ?? 75} characters.`,

    missingFullName: () => `Please enter first and last name.`,

    invalidPartStructure: () => `Each name part needs a letter.`,

    // --- Mail Validators ---
    invalidMailFormat: () => `Enter a valid email.`,

    invalidMailDomain: () => `Invalid domain after the @.`,

    uniqueEmail: () => `Email already in use.`,

    // --- Phone Validators ---
    invalidPhoneChars: () => `Only digits, spaces, + - / ( ) allowed.`,

    minPhoneDigits: (_field, errData?: { required: number; actual: number }) =>
      `At least ${errData?.required ?? 6} digits needed.`,

    maxPhoneDigits: (_field, errData?: { required: number; actual: number }) =>
      `Max ${errData?.required ?? 15} digits.`,

    invalidPhoneBrackets: () => `The parentheses do not match / close.`,

    // --- Angular standard validator (used for Validators.required) ---
    required: (field) => `Your ${field} is required.`,

    requiredDefault: () => 'This field is required.',
  };

  /**
   * Returns the message for the first error of a control.
   *
   * @param errors - The `errors` object of a form control (`control.errors`).
   * @param fieldName - Label of the field, inserted into messages that mention it.
   * @returns `null` if there are no errors, the matching message for the first error key,
   * or the generic "Invalid input." if no message is registered for that key.
   */
  getErrorMessage(errors: ValidationErrors | null, fieldName: string): string | null {
    if (!errors) return null;

    const firstKey = Object.keys(errors)[0];
    const errorMsg = this.messages[firstKey];
    return errorMsg ? errorMsg(fieldName, errors[firstKey]) : 'Invalid input.';
  }
}
