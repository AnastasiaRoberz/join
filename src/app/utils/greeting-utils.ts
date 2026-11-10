type SloganFormatter = (firstname?: string) => string;

const MORNING_SLOGANS: SloganFormatter[] = [
  (n) =>
    n ? `First coffee, then tasks, <span class="name">${n}</span>!` : 'First coffee, then tasks!',
  (n) =>
    n
      ? `Rise and shine, <span class="name">${n}</span> – let’s do this!`
      : 'Rise and shine – let’s do this!',
  (n) =>
    n
      ? `Ready to conquer the backlog, <span class="name">${n}</span>?`
      : 'Ready to conquer the backlog?',
  (n) => (n ? `Good morning, <span class="name">${n}</span>!` : 'Good morning!'),
];
const LUNCH_SLOGANS: SloganFormatter[] = [
  (n) =>
    n
      ? `Halfway there, <span class="name">${n}</span> – hungry yet?`
      : 'Halfway there – hungry yet?',
  (n) =>
    n ? `Fuel up, <span class="name">${n}</span>, you earned it!` : 'Fuel up, you earned it!',
  (n) =>
    n
      ? `Don’t drop the ball, <span class="name">${n}</span>, lunch is near!`
      : 'Don’t drop the ball, lunch is near!',

  (n) => (n ? `Happy midday, <span class="name">${n}</span>!` : 'Happy midday!'),

  (n) => (n ? `Still going strong, <span class="name">${n}</span>!` : 'Still going strong!'),
];
const AFTERNOON_SLOGANS: SloganFormatter[] = [
  (n) =>
    n
      ? `Almost beer o’clock, <span class="name">${n}</span> – keep pushing!`
      : 'Almost beer o’clock – keep pushing!',
  (n) => (n ? `One final sprint, <span class="name">${n}</span>!` : 'One final sprint!'),
  (n) =>
    n ? `Crushing tasks like a pro, <span class="name">${n}</span>!` : 'Crushing tasks like a pro!',
  (n) => (n ? `Good afternoon, <span class="name">${n}</span>!` : 'Good afternoon!'),
  (n) => (n ? `More coffee, <span class="name">${n}</span>?` : 'More coffee?'),
  (n) => (n ? `Keep it up, <span class="name">${n}</span>!` : 'Keep it up!'),
];
const EVENING_SLOGANS: SloganFormatter[] = [
  (n) =>
    n
      ? `Still here, <span class="name">${n}</span>? Dedication 100%!`
      : 'Still here? Dedication 100%!',
  (n) =>
    n
      ? `Wrap it up, <span class="name">${n}</span>, dinner is waiting!`
      : 'Wrap it up, dinner is waiting!',
  (n) =>
    n ? `Closing time is calling, <span class="name">${n}</span>!` : 'Closing time is calling!',
  (n) => (n ? `Good evening, <span class="name">${n}</span>!` : 'Good evening!'),
];
const NIGHT_SLOGANS: SloganFormatter[] = [
  (n) =>
    n ? `Go to sleep already, <span class="name">${n}</span>!` : 'Go to sleep already, night owl!',
  (n) => (n ? `Debugging in the dark, <span class="name">${n}</span>?` : 'Debugging in the dark?'),
  (n) =>
    n ? `Sleep is overrated, right, <span class="name">${n}</span>?` : 'Sleep is overrated, right?',
  (n) =>
    n ? `Burning the midnight oil, <span class="name">${n}</span>?` : 'Burning the midnight oil',
  (n) =>
    n ? `Hello from the dark side, <span class="name">${n}</span>!` : 'Hello from the dark side!',
];

function pickRandom(list: SloganFormatter[]): SloganFormatter {
  return list[Math.floor(Math.random() * list.length)];
}

export function getGreeting(firstname?: string, currentHour = new Date().getHours()): string {
  const nameWithSpans = firstname ? splitName(firstname) : undefined;
  if (currentHour >= 5 && currentHour < 11) {
    return pickRandom(MORNING_SLOGANS)(nameWithSpans);
  } else if (currentHour >= 11 && currentHour < 14) {
    return pickRandom(LUNCH_SLOGANS)(nameWithSpans);
  } else if (currentHour >= 14 && currentHour < 18) {
    return pickRandom(AFTERNOON_SLOGANS)(nameWithSpans);
  } else if (currentHour >= 18 && currentHour < 22) {
    return pickRandom(EVENING_SLOGANS)(nameWithSpans);
  } else {
    return pickRandom(NIGHT_SLOGANS)(nameWithSpans);
  }
}

function splitName(firstname: string) {
  return Array.from(firstname)
    .map((char, index) => {
      const displayChar = char === ' ' ? '&nbsp;' : char.toUpperCase();
      return `<span class="char">${displayChar}</span>`;
    })
    .join('');
}
