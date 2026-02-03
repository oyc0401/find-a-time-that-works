import { Storage } from "@apps-in-toss/web-framework";

export const TossRepository = {
  async getItem(key: string): Promise<string | undefined> {
    const value = await Storage.getItem(key);
    return value ?? undefined;
  },

  async setItem(key: string, value: string): Promise<void> {
    await Storage.setItem(key, value);
  },

  async removeItem(key: string): Promise<void> {
    await Storage.removeItem(key);
  },
};
