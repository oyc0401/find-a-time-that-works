import { nanoid } from "nanoid";
import { Repository } from "./repository";

let cached: string | undefined;

export async function getUserId(): Promise<string> {
  if (cached) return cached;
  let userId = await Repository.getUserId();
  if (!userId) {
    userId = nanoid();
    await Repository.setUserId(userId);
  }
  cached = userId;
  return userId;
}
