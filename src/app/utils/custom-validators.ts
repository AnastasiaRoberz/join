import { AbstractControl, AsyncValidatorFn, ValidationErrors, ValidatorFn } from '@angular/forms';
import { SupabaseService } from '../services/supabase';

export function generalCustomValidators(): ValidatorFn {
  // Verbietet doppelte Punkte, Bindestriche oder Leerzeichen hintereinander
  const duplicateSpecialsRegex = /([.\-\s])\1/;
  // Erkennt gängige unsichtbare Zeichen / Zero-Width-Spaces
  const invisibleCharsRegex = /[\u200B-\u200D\uFEFF]/;
  // Unerlaubte Script-/Control-Zeichen in Kontaktdaten
  const forbiddenCharsRegex = /[<>\\{}[\]]/;
  // Darf nicht mit Punkt oder Bindestrich starten/enden
  const edgeSpecialsRegex = /^[.\-]|[.\-]$/;

  return (control: AbstractControl): ValidationErrors | null => {
    const rawValue = control.value;
    if (!rawValue) return null;
    const value = rawValue.trim();

    if (value.length === 0) return { onlyWhitespace: true };

    if (rawValue.startsWith(' ') || rawValue.endsWith(' ')) return { invalidEdgeCharacter: true };

    if (invisibleCharsRegex.test(value)) return { invisibleCharacters: true };

    if (forbiddenCharsRegex.test(value)) return { forbiddenCharacters: true };

    if (edgeSpecialsRegex.test(value)) return { invalidEdgeCharacter: true };

    if (duplicateSpecialsRegex.test(value)) return { consecutiveSpecials: true };

    return null;
  };
}

export function customNameValidator(): ValidatorFn {
  // Erlaubt alle Unicode-Buchstaben, Leerzeichen, Apostroph, Punkt (für Initialen) und Bindestrich
  const allowedCharsRegex = /^[\p{L}\s'.-]+$/u;
  // Mindestens ein Buchstabe pro Namensbestandteil
  const containsLetterRegex = /\p{L}/u;

  return (control: AbstractControl): ValidationErrors | null => {
    const rawValue = control.value;
    if (!rawValue) return null;
    const value = rawValue.trim();

    if (!allowedCharsRegex.test(value)) return { invalidNameChars: true };

    // 2. Maximallänge (Sicherheit vor DB-Fehlern / DoS)
    if (value.length > 75) {
      return { maxLength: { requiredLength: 75, actualLength: value.length } };
    }

    const parts = value.split(/\s+/);

    // Mindestens Vor- und Nachname (mindestens 2 durch Leerzeichen getrennte Segmente)
    if (parts.length < 2) return { missingFullName: true };

    for (const part of parts) {
      // Jedes Segment muss mindestens einen echten Buchstaben enthalten (blockiert isolierte '-', '.', etc.)
      if (!containsLetterRegex.test(part)) {
        return { invalidPartStructure: true };
      }

      // Ein Segment darf nicht ausschließlich ein einzelnes Sonderzeichen sein
      if (part.length === 1 && !/\p{L}/u.test(part)) return { invalidPartStructure: true };
    }

    return null;
  };
}

export function customMailValidator(): ValidatorFn {
  // 1. Lokaler Teil: Buchstaben, Zahlen, erlaubte Zeichen, keine doppelten Punkte
  // 2. Domain-Teil: Buchstaben, Zahlen, Bindestriche
  // 3. TLD: Mindestens 2 Buchstaben (z.B. .de, .com, .cloud)
  const emailRegex = /^[a-zA-Z0-9._%+\-*]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

  return (control: AbstractControl): ValidationErrors | null => {
    const rawValue = control.value;
    if (!rawValue) return null;
    const value = rawValue.trim().toLowerCase();

    if (!emailRegex.test(value)) return { invalidMailFormat: true };

    // Spezifische Schwachstellen ausschließen:
    // Domain darf nicht mit einem Bindestrich starten oder enden
    const domainPart = value.split('@')[1];
    if (domainPart) {
      const domainLabels = domainPart.split('.');
      const hasInvalidDomainLabel = domainLabels.some(
        (label: string) => label.startsWith('-') || label.endsWith('-') || label.length === 0,
      );

      if (hasInvalidDomainLabel) return { invalidMailDomain: true };
    }

    return null;
  };
}

export function uniqueMailValidator(
  supabaseService: SupabaseService,
  getCurrentContactId?: () => number | undefined,
): AsyncValidatorFn {
  return async (control: AbstractControl): Promise<ValidationErrors | null> => {
    const rawValue = control.value;
    if (!rawValue) return null;
    const value = rawValue.trim().toLowerCase();

    if (control.errors && !control.errors['uniqueEmail']) return null;

    try {
      const currentId = getCurrentContactId ? getCurrentContactId() : undefined;
      let query = supabaseService.supabase.from('contacts').select('id').eq('mail', value);
      if (currentId) query = query.neq('id', currentId);
      const { data, error } = await query.maybeSingle();

      if (error) {
        console.error('Fehler bei der E-Mail-Validierung:', error);
        return null;
      }

      return data ? { uniqueEmail: true } : null;
    } catch (err) {
      console.error('Unerwarteter Fehler im Async-Validator:', err);
      return null;
    }
  };
}

export function customPhoneValidator(): ValidatorFn {
  // Erlaubt Ziffern, Leerzeichen, '-', '/', '(', ')' sowie '+' (auch am Anfang oder in Klammern)
  const allowedPhoneStructure = /^[0-9+\s/()\-]+$/;

  return (control: AbstractControl): ValidationErrors | null => {
    const rawValue = control.value;
    if (!rawValue) return null;
    const value = rawValue.trim();

    if (!allowedPhoneStructure.test(value)) return { invalidPhoneChars: true };

    // Maximal ein Pluszeichen in der gesamten Nummer erlaubt
    const plusMatches = value.match(/\+/g) || [];
    if (plusMatches.length > 1) return { invalidPhoneChars: true };

    // Wenn ein Plus existiert, darf es nur am Anfang oder direkt nach einer öffnenden Klammer stehen: "+49" oder "(+49)"
    if (plusMatches.length === 1 && !/^\+|^\(\+/.test(value)) return { invalidPhoneChars: true };

    // 2. Mindest- und Maximalanzahl reiner Ziffern (E.164 Standard)
    const digitsOnly = value.replace(/\D/g, '');
    if (digitsOnly.length < 6)
      return { minPhoneDigits: { required: 6, actual: digitsOnly.length } };
    if (digitsOnly.length > 15)
      return { maxPhoneDigits: { required: 15, actual: digitsOnly.length } };

    // 3. Plausibilitätsprüfung für Klammern: (..) muss geschlossen sein
    const openBrackets = (value.match(/\(/g) || []).length;
    const closeBrackets = (value.match(/\)/g) || []).length;
    if (openBrackets !== closeBrackets || openBrackets > 1) return { invalidPhoneBrackets: true };
    if (openBrackets === 1) {
      const openIndex = value.indexOf('(');
      const closeIndex = value.indexOf(')');
      // Schließende Klammer muss nach der öffnenden kommen und darf nicht leer sein
      if (closeIndex <= openIndex + 1) return { invalidPhoneBrackets: true };
    }

    return null;
  };
}
