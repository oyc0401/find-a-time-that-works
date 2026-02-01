import { nanoid } from "nanoid";
import { Repository } from "./repository";

const USER_ID_KEY = "findtime_user_id";

export async function getUserId(): Promise<string> {
  let userId = await Repository.getItem(USER_ID_KEY);
  if (!userId) {
    userId = nanoid();
    await Repository.setItem(USER_ID_KEY, userId);
  }
  return userId;
}
