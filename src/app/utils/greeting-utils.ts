/** Structured greeting parts to avoid innerHTML / XSS. */
export interface GreetingParts {
  prefix: string;
  name?: string;
  suffix?: string;
}

/** Builds a slogan, optionally with the user's firstname. */
type SloganFormatter = (firstname?: string) => GreetingParts;

/** Helper creating a slogan formatter with name interpolation and optional fallback. */
function slogan(prefix: string, suffix: string, noName?: string): SloganFormatter {
  return (n?: string): GreetingParts =>
    n ? { prefix, name: n, suffix } : { prefix: noName ?? `${prefix.trimEnd()}${suffix}` };
}

const MORNING_SLOGANS: SloganFormatter[] = [
  slogan('First coffee, then tasks, ', '!'),
  slogan('Rise and shine, ', ' – let’s do this!'),
  slogan('Ready to conquer the backlog, ', '?'),
  slogan('Good morning, ', '!'),
];
const LUNCH_SLOGANS: SloganFormatter[] = [
  slogan('Halfway there, ', ' – hungry yet?'),
  slogan('Fuel up, ', ', you earned it!'),
  slogan('Don’t drop the ball, ', ', lunch is near!'),
  slogan('Happy midday, ', '!'),
  slogan('Still going strong, ', '!'),
];
const AFTERNOON_SLOGANS: SloganFormatter[] = [
  slogan('Almost beer o’clock, ', ' – keep pushing!'),
  slogan('One final sprint, ', '!'),
  slogan('Crushing tasks like a pro, ', '!'),
  slogan('Good afternoon, ', '!'),
  slogan('More coffee, ', '?'),
  slogan('Keep it up, ', '!'),
];
const EVENING_SLOGANS: SloganFormatter[] = [
  slogan('Still here, ', '? Dedication 100%!'),
  slogan('Wrap it up, ', ', dinner is waiting!'),
  slogan('Closing time is calling, ', '!'),
  slogan('Good evening, ', '!'),
];
const NIGHT_SLOGANS: SloganFormatter[] = [
  slogan('Go to sleep already, ', '!', 'Go to sleep already, night owl!'),
  slogan('Debugging in the dark, ', '?'),
  slogan('Sleep is overrated, right, ', '?'),
  slogan('Burning the midnight oil, ', '?', 'Burning the midnight oil'),
  slogan('Hello from the dark side, ', '!'),
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
  if (currentHour >= 5 && currentHour < 11) {
    return pickRandom(MORNING_SLOGANS)(firstname);
  } else if (currentHour >= 11 && currentHour < 14) {
    return pickRandom(LUNCH_SLOGANS)(firstname);
  } else if (currentHour >= 14 && currentHour < 18) {
    return pickRandom(AFTERNOON_SLOGANS)(firstname);
  } else if (currentHour >= 18 && currentHour < 22) {
    return pickRandom(EVENING_SLOGANS)(firstname);
  } else {
    return pickRandom(NIGHT_SLOGANS)(firstname);
  }
}
