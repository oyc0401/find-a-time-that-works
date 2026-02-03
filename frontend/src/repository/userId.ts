import { nanoid } from "nanoid";
import { TossRepository } from "./toss-repository";

const USER_ID_KEY = "findtime_user_id";

let cached: string | undefined;

export async function getUserId(): Promise<string> {
  if (cached) return cached;
  let userId = await TossRepository.getItem(USER_ID_KEY);
  if (!userId) {
    userId = nanoid();
    await TossRepository.setItem(USER_ID_KEY, userId);
  }
  cached = userId;
  return userId;
}
