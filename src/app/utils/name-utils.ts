/** Matches an academic title or salutation (e.g. "Dr.", "Prof.") at the start of a name, including the following space. */
const titleRegex =
  /^(prof\.?|dr\.?|med\.?|dent\.?|habil\.?|rer\.?|nat\.?|ing\.?|iur\.?|jur\.?|theol\.?|phil\.?|mba|bsc|msc|ba|ma|dipl\.?(-ing\.?)?)\s+/i;

/** Name parts as stored in the contacts table. */
export interface NameParts {
  title: string | null;
  firstname: string;
  surname: string;
}

/**
 * Peels academic titles off the front of a name, one by one.
 *
 * @param name - Whitespace-normalized full name.
 * @returns The joined titles (or `null` if there are none) and the remaining name without titles.
 */
function extractTitles(name: string): { title: string | null; remainingName: string } {
  const titles: string[] = [];
  let remainingName = name;
  let match = remainingName.match(titleRegex);
  while (match) {
    titles.push(match[1]);
    remainingName = remainingName.slice(match[0].length);
    match = remainingName.match(titleRegex);
  }
  return { title: titles.length ? titles.join(' ') : null, remainingName };
}

/**
 * Splits a full name into title, firstname and surname.
 * The surname is the part behind the last space, the firstname everything before it.
 *
 * @param fullName - The full name as typed by the user.
 * @returns The name parts to be stored in the contacts table.
 */
export function splitName(fullName: string): NameParts {
  const trimmed = fullName.trim().replace(/\s+/g, ' ');
  const { title, remainingName } = extractTitles(trimmed);

  const lastSpaceIndex = remainingName.lastIndexOf(' ');
  const firstname =
    lastSpaceIndex === -1 ? remainingName : remainingName.substring(0, lastSpaceIndex);
  const surname = lastSpaceIndex === -1 ? '' : remainingName.substring(lastSpaceIndex + 1);

  return { title, firstname, surname };
}

/**
 * Combines the name parts of a contact into one display name.
 *
 * @param contact - Contact (or name parts) with optional title.
 * @returns Title, firstname and surname joined by spaces; an empty title is left out.
 */
export function fullName(contact: {
  title?: string | null;
  firstname: string;
  surname: string;
}): string {
  return [contact.title, contact.firstname, contact.surname].filter(Boolean).join(' ');
}
