export function generateRandomName(): string {
  const hex = crypto.getRandomValues(new Uint8Array(4));
  return Array.from(hex)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}
