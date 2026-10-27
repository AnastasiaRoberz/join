/**
 * Generates a random HSL color string with fixed saturation (70%) and lightness (40%)
 * suitable for contact avatar badges with white text contrast.
 *
 * @returns An HSL color string (e.g., `'hsl(210, 70%, 40%)'`).
 */
export function getRandomColor(): string {
  const hue = Math.floor(Math.random() * 360);
  const saturation = 70;
  const lightness = 40;

  return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
}

/**
 * Capitalizes the first character of a given string while leaving the remaining characters unchanged.
 *
 * @param value - The input string to capitalize.
 * @returns The string with its first letter converted to uppercase.
 */
export function capitalizeFirstLetter(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

/**
 * Generic search filter utility that filters an array of items against a search term.
 *
 * - Strings returned by `getSearchStrings` are matched using case-insensitive `startsWith()`.
 * - Strings returned by the optional `getIncludeStrings` are matched using case-insensitive `includes()`.
 *
 * @typeParam T - The type of items in the array.
 * @param items - Full array of items to filter.
 * @param searchTerm - Raw search string entered by the user.
 * @param getSearchStrings - Callback returning item fields that must match via `startsWith()`.
 * @param getIncludeStrings - Optional callback returning item fields that may match via `includes()`.
 * @returns Filtered array of items matching either the `startsWith` or `includes` criteria.
 */
export function filterInput<T>(
  items: T[],
  searchTerm: string,
  getSearchStrings: (item: T) => (string | undefined | null)[],
  getIncludeStrings?: (item: T) => (string | undefined | null)[],
): T[] {
  const term = searchTerm.trim().toLowerCase();
  if (!term) return items;

  return items.filter((item) => {
    const matchesStartsWith = getSearchStrings(item).some((value) =>
      value?.toLowerCase().startsWith(term),
    );
    const matchesIncludes =
      getIncludeStrings?.(item).some((value) => value?.toLowerCase().includes(term)) ?? false;

    return matchesStartsWith || matchesIncludes;
  });
}
