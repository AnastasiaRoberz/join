export function getRandomColor() {
  const hue = Math.floor(Math.random() * 360);
  const saturation = 70;
  const lightness = 40;

  return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
}
