import { nanoid } from "nanoid";

const USER_ID_KEY = "findtime_user_id";

export function getUserId(): string {
  let userId = localStorage.getItem(USER_ID_KEY);
  if (!userId) {
    userId = nanoid();
    localStorage.setItem(USER_ID_KEY, userId);
  }
  return userId;
}
