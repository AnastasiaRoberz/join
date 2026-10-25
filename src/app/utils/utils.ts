export function getRandomColor() {
  const hue = Math.floor(Math.random() * 360);
  const saturation = 70;
  const lightness = 40;

  return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
}

export function capitalizeFirstLetter(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

export function filterInput<T>(
  items: T[],
  searchTerm: string,
  getSearchStrings: (item: T) => (string | undefined | null)[],
): T[] {
  const term = searchTerm.trim().toLowerCase();
  if (!term) return items;

  return items.filter((item) =>
    getSearchStrings(item).some((value) => value?.toLowerCase().startsWith(term)),
  );
}
