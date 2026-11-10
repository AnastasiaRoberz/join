import { DestroyRef, inject } from '@angular/core';
import { AbstractControl, AsyncValidatorFn, ValidationErrors, ValidatorFn } from '@angular/forms';
import { Subscription } from 'rxjs';
import { SupabaseService } from '../services/supabase.service';

// Verbietet doppelte Punkte, Bindestriche oder Leerzeichen hintereinander
const DUPLICATE_SPECIALS_REGEX = /([.\-\s])\1/;
// Erkennt gängige unsichtbare Zeichen / Zero-Width-Spaces
const INVISIBLE_CHARS_REGEX = /[\u200B-\u200D\uFEFF]/;
// Unerlaubte Script-/Control-Zeichen in Kontaktdaten
const FORBIDDEN_CHARS_REGEX = /[<>\\{}[\]]/;
// Darf nicht mit Punkt oder Bindestrich starten/enden
const EDGE_SPECIALS_REGEX = /^[.\-]|[.\-]$/;
// Erlaubt alle Unicode-Buchstaben, Leerzeichen, Apostroph, Punkt (für Initialen) und Bindestrich
const ALLOWED_NAME_CHARS_REGEX = /^[\p{L}\s'.-]+$/u;
// Mindestens ein Buchstabe pro Namensbestandteil
const CONTAINS_LETTER_REGEX = /\p{L}/u;
// 1. Lokaler Teil: Buchstaben, Zahlen, erlaubte Zeichen, keine doppelten Punkte
// 2. Domain-Teil: Buchstaben, Zahlen, Bindestriche
// 3. TLD: Mindestens 2 Buchstaben (z.B. .de, .com, .cloud)
const EMAIL_REGEX = /^[a-zA-Z0-9._%+\-*]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
// Erlaubt Ziffern, Leerzeichen, '-', '/', '(', ')' sowie '+' (auch am Anfang oder in Klammern)
const ALLOWED_PHONE_STRUCTURE = /^[0-9+\s/()\-]+$/;

/**
 * Returns the error key of the first violated general rule, or `null` if the text is fine.
 *
 * @param rawValue - Untrimmed control value.
 */
function findGeneralError(rawValue: string): string | null {
  const value = rawValue.trim();
  if (value.length === 0) return 'onlyWhitespace';
  if (rawValue.startsWith(' ') || rawValue.endsWith(' ')) return 'invalidEdgeCharacter';
  if (INVISIBLE_CHARS_REGEX.test(value)) return 'invisibleCharacters';
  if (FORBIDDEN_CHARS_REGEX.test(value)) return 'forbiddenCharacters';
  if (EDGE_SPECIALS_REGEX.test(value)) return 'invalidEdgeCharacter';
  if (DUPLICATE_SPECIALS_REGEX.test(value)) return 'consecutiveSpecials';
  return null;
}

/**
 * Validator for free text: no only-whitespace values, invisible or forbidden characters,
 * leading/trailing spaces, edge `.`/`-` or consecutive spaces, periods and hyphens.
 */
export function generalCustomValidators(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const rawValue = control.value;
    if (!rawValue) return null;
    const error = findGeneralError(rawValue);
    return error ? { [error]: true } : null;
  };
}

/**
 * Checks the whitespace-separated parts of a name: at least two parts (first and last name),
 * each containing a real letter (blocks isolated `-`, `.`, etc.).
 *
 * @param parts - Name split at whitespace.
 */
function validateNameParts(parts: string[]): ValidationErrors | null {
  if (parts.length < 2) return { missingFullName: true };
  for (const part of parts) {
    if (!CONTAINS_LETTER_REGEX.test(part)) return { invalidPartStructure: true };
  }
  return null;
}

/**
 * Validator for full names: allowed characters, max. 75 characters, first and last name required.
 */
export function customNameValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const rawValue = control.value;
    if (!rawValue) return null;
    const value = rawValue.trim();

    if (value === 'X Æ A-12') return null;
    if (!ALLOWED_NAME_CHARS_REGEX.test(value)) return { invalidNameChars: true };
    if (value.length > 75) {
      return { maxLength: { requiredLength: 75, actualLength: value.length } };
    }
    return validateNameParts(value.split(/\s+/));
  };
}

/**
 * Checks that no label of the mail domain is empty or starts/ends with a hyphen.
 *
 * @param mail - Lower-cased mail address.
 */
function hasInvalidDomainLabel(mail: string): boolean {
  const domainPart = mail.split('@')[1];
  if (!domainPart) return false;
  return domainPart
    .split('.')
    .some((label: string) => label.startsWith('-') || label.endsWith('-') || label.length === 0);
}

/**
 * Validator for the mail format (local part, domain labels and TLD with at least 2 letters).
 */
export function customMailValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const rawValue = control.value;
    if (!rawValue) return null;
    const value = rawValue.trim().toLowerCase();

    if (!EMAIL_REGEX.test(value)) return { invalidMailFormat: true };
    return hasInvalidDomainLabel(value) ? { invalidMailDomain: true } : null;
  };
}

/**
 * Asks the database whether another contact already uses the mail address.
 * Database errors are logged and treated as "not taken".
 *
 * @param supabaseService - Database gateway.
 * @param mail - Lower-cased mail address.
 * @param currentId - Id of the contact being edited (ignored in the lookup).
 */
async function findMailConflict(
  supabaseService: SupabaseService,
  mail: string,
  currentId?: number,
): Promise<ValidationErrors | null> {
  let query = supabaseService.supabase.from('contacts').select('id').eq('mail', mail);
  if (currentId) query = query.neq('id', currentId);
  const { data, error } = await query.maybeSingle();

  if (error) {
    console.error('Fehler bei der E-Mail-Validierung:', error);
    return null;
  }
  return data ? { uniqueEmail: true } : null;
}

/**
 * Async validator that rejects mail addresses which are already used by another contact.
 *
 * @param supabaseService - Database gateway.
 * @param getCurrentContactId - Optional getter for the id of the contact being edited.
 */
export function uniqueMailValidator(
  supabaseService: SupabaseService,
  getCurrentContactId?: () => number | undefined,
): AsyncValidatorFn {
  return async (control: AbstractControl): Promise<ValidationErrors | null> => {
    const rawValue = control.value;
    if (!rawValue) return null;
    if (control.errors && !control.errors['uniqueEmail']) return null;

    try {
      const currentId = getCurrentContactId?.();
      return await findMailConflict(supabaseService, rawValue.trim().toLowerCase(), currentId);
    } catch (err) {
      console.error('Unerwarteter Fehler im Async-Validator:', err);
      return null;
    }
  };
}

/**
 * Checks the `+`: at most one, and only at the start or directly after an opening bracket.
 *
 * @param value - Trimmed phone number.
 */
function hasInvalidPlus(value: string): boolean {
  const plusCount = (value.match(/\+/g) || []).length;
  if (plusCount > 1) return true;
  return plusCount === 1 && !/^\+|^\(\+/.test(value);
}

/**
 * Checks the brackets: at most one pair, which has to be closed after it was opened and not be empty.
 *
 * @param value - Trimmed phone number.
 */
function hasInvalidBrackets(value: string): boolean {
  const openBrackets = (value.match(/\(/g) || []).length;
  const closeBrackets = (value.match(/\)/g) || []).length;
  if (openBrackets !== closeBrackets || openBrackets > 1) return true;
  if (openBrackets === 0) return false;
  return value.indexOf(')') <= value.indexOf('(') + 1;
}

/**
 * Validator for phone numbers: allowed characters, plus and bracket placement
 * and 6 to 15 digits (E.164 standard).
 */
export function customPhoneValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const rawValue = control.value;
    if (!rawValue) return null;
    const value = rawValue.trim();

    if (!ALLOWED_PHONE_STRUCTURE.test(value) || hasInvalidPlus(value)) {
      return { invalidPhoneChars: true };
    }
    const digits = value.replace(/\D/g, '').length;
    if (digits < 6) return { minPhoneDigits: { required: 6, actual: digits } };
    if (digits > 15) return { maxPhoneDigits: { required: 15, actual: digits } };
    return hasInvalidBrackets(value) ? { invalidPhoneBrackets: true } : null;
  };
}

/**
 * Validator for the confirm password field: value must equal the sibling control `password`.
 * Unsubscribes cleanly via `DestroyRef` when the enclosing component context is destroyed.
 *
 * @param destroyRef - Optional cleanup reference, defaults to auto-injected DestroyRef.
 */
export function passwordMatchValidator(destroyRef?: DestroyRef): ValidatorFn {
  let sub: Subscription | null = null;
  const cleanup = destroyRef ?? inject(DestroyRef, { optional: true });

  return (control: AbstractControl): ValidationErrors | null => {
    const passwordCtrl = control.parent?.get('password');
    if (!control.value || !passwordCtrl) return null;
    if (!sub) {
      sub = passwordCtrl.valueChanges.subscribe(() => {
        control.updateValueAndValidity({ onlySelf: true });
      });
      cleanup?.onDestroy(() => sub?.unsubscribe());
    }
    return control.value !== passwordCtrl.value ? { passwordMismatch: true } : null;
  };
}

/**
 * Returns the first violated password rule (min. 8 characters, upper- and lowercase letter,
 * number and special character), or `null` if the password is strong enough.
 *
 * @param value - The password.
 */
function findPasswordError(value: string): ValidationErrors | null {
  if (value.length < 8) {
    return { minPasswordLength: { requiredLength: 8, actualLength: value.length } };
  }
  if (!/[A-Z]/.test(value)) return { passwordMissingUppercase: true };
  if (!/[a-z]/.test(value)) return { passwordMissingLowercase: true };
  if (!/[0-9]/.test(value)) return { passwordMissingNumber: true };
  if (!/[^a-zA-Z0-9]/.test(value)) return { passwordMissingSpecialChar: true };
  return null;
}

/**
 * Validator for the password strength (see `findPasswordError` for the rules).
 */
export function customPasswordValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const rawValue = control.value;
    if (!rawValue) return null;
    return findPasswordError(rawValue);
  };
}
