import { TossRepository } from "./toss-repository";

const KEYS = {
  userId: "findtime_user_id",
  generatedNickname: "defaultName",
  rememberName: "rememberName",
  defaultThumbnail: "defaultThumbnail",
} as const;

export const Repository = {
  async getUserId(): Promise<string | undefined> {
    const value = await TossRepository.getItem(KEYS.userId);
    return value ?? undefined;
  },

  async setUserId(value: string): Promise<void> {
    await TossRepository.setItem(KEYS.userId, value);
  },

  async getGeneratedNickname(): Promise<string | undefined> {
    const value = await TossRepository.getItem(KEYS.generatedNickname);
    return value ?? undefined;
  },

  async setGeneratedNickname(value: string): Promise<void> {
    await TossRepository.setItem(KEYS.generatedNickname, value);
  },

  async getRememberName(): Promise<string | undefined> {
    const value = await TossRepository.getItem(KEYS.rememberName);
    return value ?? undefined;
  },

  async setRememberName(value: string): Promise<void> {
    await TossRepository.setItem(KEYS.rememberName, value);
  },

  async getDefaultThumbnail(): Promise<string | undefined> {
    const value = await TossRepository.getItem(KEYS.defaultThumbnail);
    return value ?? undefined;
  },

  async setDefaultThumbnail(value: string): Promise<void> {
    await TossRepository.setItem(KEYS.defaultThumbnail, value);
  },
};
