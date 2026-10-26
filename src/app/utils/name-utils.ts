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
  // trims unnecessary spaces out
  let trimmed = fullName.trim().replace(/\s+/g, ' ');

  // Peel off titles one by one from the front
  const titles: string[] = []; // array for titles
  let match = trimmed.match(titleRegex); // checks if trimmed name starts with a title = null or array
  while (match) {
    // loop, which keeps checking for titles until null
    titles.push(match[1]); // stores title each run withoit the space
    trimmed = trimmed.slice(match[0].length); // cuts off the stired title with the space
    match = trimmed.match(titleRegex); // checks the trimmed name one last time to stop the loop
  }

  const lastSpaceIndex = trimmed.lastIndexOf(' '); // counts the charavters and spaces and identifies the last space
  const firstname = lastSpaceIndex === -1 ? trimmed : trimmed.substring(0, lastSpaceIndex); // first name is everything before the last space (0 -> lastSpace)
  const surname = lastSpaceIndex === -1 ? '' : trimmed.substring(lastSpaceIndex + 1); // last name is everything behind the last space (lastSpace +1 -> end)

  return { title: titles.length ? titles.join(' ') : null, firstname, surname }; // combine titles with space inbetween into title (or null) and also store firstname + surname
}

// combines name parts into one fullName for easier display purposes in componennts
export function fullName(contact: {
  title?: string | null;
  firstname: string;
  surname: string;
}): string {
  return [contact.title, contact.firstname, contact.surname].filter(Boolean).join(' '); // filter for filtering out null if no title
}
