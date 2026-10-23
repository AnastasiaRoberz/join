// for splicing out title before storing and using name cleaner afterwards

// Liste gängiger akademischer Titel und Anreden (Groß-/Kleinschreibung und Punkte beachten)
const titleRegex =
  /^(prof\.?|dr\.?|med\.?|dent\.?|habil\.?|rer\.?|nat\.?|ing\.?|iur\.?|jur\.?|theol\.?|phil\.?|mba|bsc|msc|ba|ma|dipl\.?(-ing\.?)?)\s+/i;

// name is split into the parts stored in the contacts table
export interface NameParts {
  title: string | null;
  firstname: string;
  surname: string;
}

// Splits a full name into title, firstname and surname
export function splitName(fullName: string): NameParts {
  // Collapse double spaces so "Dr.  Anna" works too
  let rest = fullName.trim().replace(/\s+/g, ' ');

  // Peel off titles one by one from the front
  const titles: string[] = [];
  let match = rest.match(titleRegex);
  while (match) {
    titles.push(match[1]);
    rest = rest.slice(match[0].length);
    match = rest.match(titleRegex);
  }

  const lastSpaceIndex = rest.lastIndexOf(' ');
  const firstname = lastSpaceIndex === -1 ? rest : rest.substring(0, lastSpaceIndex);
  const surname = lastSpaceIndex === -1 ? '' : rest.substring(lastSpaceIndex + 1);

  return { title: titles.length ? titles.join(' ') : null, firstname, surname };
}

/**
 * Joins the stored parts back into one display name.
 * Empty parts are skipped, so there are no double spaces.
 */
export function fullName(contact: {
  title?: string | null;
  firstname: string;
  surname: string;
}): string {
  return [contact.title, contact.firstname, contact.surname].filter(Boolean).join(' ');
}
