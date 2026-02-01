const STORAGE_KEY = "frontweb_user_id";

function nanoid(size = 12): string {
  const alphabet =
    "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ_abcdefghijklmnopqrstuvwxyz-";
  let id = "";
  const cryptoObj = crypto.getRandomValues(new Uint8Array(size));
  cryptoObj.forEach((value) => {
    id += alphabet[value % alphabet.length];
  });
  return id;
}

export async function getOrCreateUserId(): Promise<string> {
  const cached = localStorage.getItem(STORAGE_KEY);
  if (cached) {
    return cached;
  }
  const next = nanoid();
  localStorage.setItem(STORAGE_KEY, next);
  return next;
}
