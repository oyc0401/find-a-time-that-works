import { TossRepository } from "./toss-repository";

const KEYS = {
  userId: "findtime_user_id",
  generatedNickname: "defaultName",
  nickname: "nickname",
  rememberNicknameFlag: "rememberNicknameFlag",
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

  async getNickname(): Promise<string | undefined> {
    const value = await TossRepository.getItem(KEYS.nickname);
    return value ?? undefined;
  },

  async setNickname(value: string): Promise<void> {
    await TossRepository.setItem(KEYS.nickname, value);
  },

  async getRememberNicknameFlag(): Promise<string | undefined> {
    const value = await TossRepository.getItem(KEYS.rememberNicknameFlag);
    return value ?? undefined;
  },

  async setRememberNicknameFlag(value: string): Promise<void> {
    await TossRepository.setItem(KEYS.rememberNicknameFlag, value);
  },

  async getDefaultThumbnail(): Promise<string | undefined> {
    const value = await TossRepository.getItem(KEYS.defaultThumbnail);
    return value ?? undefined;
  },

  async setDefaultThumbnail(value: string): Promise<void> {
    await TossRepository.setItem(KEYS.defaultThumbnail, value);
  },
};
