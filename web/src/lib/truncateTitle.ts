const MAX_WIDTH = 28;

function isWide(char: string): boolean {
  const code = char.charCodeAt(0);
  return code > 0x7f;
}

export function truncateTitle(text: string): string {
  let width = 0;
  for (let i = 0; i < text.length; i++) {
    width += isWide(text[i]) ? 2 : 1;
    if (width > MAX_WIDTH) {
      return `${text.slice(0, i)}…`;
    }
  }
  return text;
}
