/** Structured greeting parts to avoid innerHTML / XSS. */
export interface GreetingParts {
  prefix: string;
  name?: string[];
  suffix?: string;
}

/** Builds a slogan, optionally with the user's firstname. */
export type SloganFormatter = (firstname?: string) => GreetingParts;

/** Helper creating a slogan formatter with name interpolation and optional fallback. */
function slogan(prefix: string, suffix: string, noName?: string): SloganFormatter {
  return (n?: string): GreetingParts => {
    const trimmed = n?.trim();
    return trimmed
      ? { prefix, name: splitGreetingChars(trimmed), suffix }
      : { prefix: noName ?? `${prefix.trimEnd().replace(/,$/, '')}${suffix}` };
  };
}

/** Slogans displayed during morning hours. */
const MORNING_SLOGANS: SloganFormatter[] = [
  slogan('First coffee, then tasks, ', '!'),
  slogan('Rise and shine, ', " – let's do this!", "Rise and shine – let's do this!"),
  slogan('Ready to conquer the backlog, ', '?', 'Ready to conquer the backlog?'),
  slogan('Good morning, ', '!', 'Good morning!'),
];
/** Slogans displayed around lunch time. */
const LUNCH_SLOGANS: SloganFormatter[] = [
  slogan('Halfway there, ', ' – hungry yet?', 'Halfway there – hungry yet?'),
  slogan('Fuel up, ', ', you earned it!', 'Fuel up, you earned it!'),
  slogan("Don't drop the ball, ", ', lunch is near!', "Don't drop the ball, lunch is near!"),
  slogan('Happy midday, ', '!', 'Happy midday!'),
  slogan('Still going strong, ', '!', 'Still going strong!'),
];
/** Slogans displayed during the afternoon. */
const AFTERNOON_SLOGANS: SloganFormatter[] = [
  slogan("Almost beer o'clock, ", ' – keep pushing!', "Almost beer o'clock – keep pushing!"),
  slogan('One final sprint, ', '!', 'One final sprint!'),
  slogan('Crushing tasks like a pro, ', '!', 'Crushing tasks like a pro!'),
  slogan('Good afternoon, ', '!', 'Good afternoon!'),
  slogan('More coffee, ', '?', 'More coffee?'),
  slogan('Keep it up, ', '!', 'Keep it up!'),
];
/** Slogans displayed during the evening. */
const EVENING_SLOGANS: SloganFormatter[] = [
  slogan('Still here, ', '? Dedication 100%!', 'Still here? Dedication 100%!'),
  slogan('Wrap it up, ', ', dinner is waiting!', 'Wrap it up, dinner is waiting!'),
  slogan('Closing time is calling, ', '!', 'Closing time is calling!'),
  slogan('Good evening, ', '!', 'Good evening!'),
];
/** Slogans displayed late at night. */
const NIGHT_SLOGANS: SloganFormatter[] = [
  slogan('Go to sleep already, ', '!', 'Go to sleep already, night owl!'),
  slogan('Debugging in the dark, ', '?', 'Debugging in the dark?'),
  slogan('Sleep is overrated, right, ', '?', 'Sleep is overrated, right?'),
  slogan('Burning the midnight oil, ', '?', 'Burning the midnight oil?'),
  slogan('Hello from the dark side, ', '!', 'Hello from the dark side!'),
];

/**
 * Picks a random slogan formatter from the given list.
 *
 * @param list - Slogans of one time of day.
 * @returns A randomly chosen slogan formatter.
 */
function pickRandom(list: SloganFormatter[]): SloganFormatter {
  return list[Math.floor(Math.random() * list.length)];
}

/**
 * Selects and returns a stable slogan formatter for the current time of day.
 *
 * @param currentHour - Hour of the day (0–23). Defaults to the current hour.
 * @returns A randomly chosen slogan formatter for the given daytime period.
 */
export function getGreetingFormatter(currentHour: number = new Date().getHours()): SloganFormatter {
  if (currentHour >= 5 && currentHour < 11) {
    return pickRandom(MORNING_SLOGANS);
  } else if (currentHour >= 11 && currentHour < 14) {
    return pickRandom(LUNCH_SLOGANS);
  } else if (currentHour >= 14 && currentHour < 18) {
    return pickRandom(AFTERNOON_SLOGANS);
  } else if (currentHour >= 18 && currentHour < 22) {
    return pickRandom(EVENING_SLOGANS);
  } else {
    return pickRandom(NIGHT_SLOGANS);
  }
}

/**
 * Returns a random greeting object for the time of day (05–11 morning, 11–14 lunch, 14–18 afternoon,
 * 18–22 evening, otherwise night). Safe for template interpolation without innerHTML.
 *
 * @param firstname - Optional firstname to include in the greeting.
 * @param currentHour - Hour of the day (0–23). Defaults to the current hour.
 * @returns The structured greeting parts.
 */
export function getGreeting(
  firstname?: string,
  currentHour: number = new Date().getHours(),
): GreetingParts {
  return getGreetingFormatter(currentHour)(firstname);
}

/** Splits a firstname into uppercase display characters, preserving spaces as non-breaking spaces. */
function splitGreetingChars(firstname: string): string[] {
  return Array.from(firstname).map((char) => (char === ' ' ? '\u00A0' : char.toUpperCase()));
}
