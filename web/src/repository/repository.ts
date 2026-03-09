import { TossRepository } from "./toss-repository";

const KEYS = {
  userId: "userId",
  generatedNickname: "generatedNickname",
  savedNickname: "savedNickname",
  defaultThumbnail: "defaultThumbnail",
  recentRoomId: "recentRoomId",
  recentRoomIds: "recentRoomIds",
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

  async getSavedNickname(): Promise<string | undefined> {
    const value = await TossRepository.getItem(KEYS.savedNickname);
    return value ?? undefined;
  },

  async setSavedNickname(value: string): Promise<void> {
    await TossRepository.setItem(KEYS.savedNickname, value);
  },

  async getDefaultThumbnail(): Promise<string | undefined> {
    const value = await TossRepository.getItem(KEYS.defaultThumbnail);
    return value ?? undefined;
  },

  async setDefaultThumbnail(value: string): Promise<void> {
    await TossRepository.setItem(KEYS.defaultThumbnail, value);
  },

  async getRecentRoomId(): Promise<string | undefined> {
    const value = await TossRepository.getItem(KEYS.recentRoomId);
    return value ?? undefined;
  },

  async setRecentRoomId(value: string): Promise<void> {
    await TossRepository.setItem(KEYS.recentRoomId, value);
    await Repository.prependRecentRoomId(value);
  },

  async removeRecentRoomId(): Promise<void> {
    await TossRepository.removeItem(KEYS.recentRoomId);
  },

  async getRecentRoomIds(): Promise<string[]> {
    const value = await TossRepository.getItem(KEYS.recentRoomIds);
    if (!value) return [];
    try {
      const parsed = JSON.parse(value);
      if (Array.isArray(parsed)) return parsed as string[];
      return [];
    } catch {
      return [];
    }
  },

  async prependRecentRoomId(roomId: string): Promise<void> {
    const ids = await Repository.getRecentRoomIds();
    const filtered = ids.filter((id) => id !== roomId);
    const updated = [roomId, ...filtered];
    await TossRepository.setItem(KEYS.recentRoomIds, JSON.stringify(updated));
  },
};
