import { AbstractControl, AsyncValidatorFn, ValidationErrors, ValidatorFn } from '@angular/forms';
import { SupabaseService } from '../services/supabase';

export function generalCustomValidators(): ValidatorFn {
  const noConsecutiveSpecials = /^(?!.*([.\-\s])\1).*$/;

  return (control: AbstractControl): ValidationErrors | null => {
    const value = control.value;
    if (!value) return null;

    if (!noConsecutiveSpecials.test(value)) return { invalidSpecials: true };
    if (typeof value === 'string' && value.trim().length === 0) return { onlyWhitespace: true };
    return null;
  };
}

export function customNameValidator(): ValidatorFn {
  const allowedChars = /^[\p{L}\s'.-]+$/u;

  return (control: AbstractControl): ValidationErrors | null => {
    const value = control.value;
    if (!value) return null;

    if (!allowedChars.test(value)) return { invalidChars: true };
    const wordsCount = control.value
      .trim()
      .split(/\s/)
      .filter((word: any) => word.length >= 2);
    if (!(wordsCount.length >= 2)) return { minNames: true };
    return null;
  };
}

export function customMailValidator(): ValidatorFn {
  const basicMailFormat =
    /^[a-zA-Z0-9_%+-]+(?:[.-][a-zA-Z0-9_%+-]+)*@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

  return (control: AbstractControl): ValidationErrors | null => {
    const value = control.value;
    if (!value) return null;

    return basicMailFormat.test(value) ? null : { invalidMail: true };
  };
}

export function uniqueMailValidator(
  supabaseService: SupabaseService,
  getCurrentContactId?: () => number | undefined,
): AsyncValidatorFn {
  return async (control: AbstractControl): Promise<ValidationErrors | null> => {
    const value = control.value;
    if (!value) return null;

    const currentId = getCurrentContactId ? getCurrentContactId() : undefined;
    let query = supabaseService.supabase.from('contacts').select('id').eq('mail', value);
    if (currentId) query = query.neq('id', currentId);
    const { data, error } = await query.single();

    return data ? { uniqueEmail: true } : null;
  };
}

export function customPhoneValidator(): ValidatorFn {
  const basicPhoneFormat = /^\+?[0-9\s\()]{6,20}$/;

  return (control: AbstractControl): ValidationErrors | null => {
    const value = control.value;
    if (!value) return null;

    return basicPhoneFormat.test(value) ? null : { invalidPhone: true };
  };
}
