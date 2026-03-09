import { Storage } from "@apps-in-toss/web-framework";

function isNativeStorageAvailable() {
  if (typeof window === "undefined") return false;
  return typeof (window as { ReactNativeWebView?: unknown }).ReactNativeWebView !== "undefined";
}

function readFromLocal(key: string): string | undefined {
  if (typeof window === "undefined" || !window.localStorage) return undefined;
  try {
    return window.localStorage.getItem(key) ?? undefined;
  } catch {
    return undefined;
  }
}

function writeToLocal(key: string, value: string): void {
  if (typeof window === "undefined" || !window.localStorage) return;
  try {
    window.localStorage.setItem(key, value);
  } catch {
    // ignore quota/security errors on fallback storage
  }
}

function removeFromLocal(key: string): void {
  if (typeof window === "undefined" || !window.localStorage) return;
  try {
    window.localStorage.removeItem(key);
  } catch {
    // ignore
  }
}

export const TossRepository = {
  async getItem(key: string): Promise<string | undefined> {
    if (isNativeStorageAvailable()) {
      try {
        const value = await Storage.getItem(key);
        if (value != null) {
          writeToLocal(key, value);
        }
        return value ?? undefined;
      } catch (error) {
        console.warn("[Repository] native Storage.getItem failed, falling back", error);
      }
    }
    return readFromLocal(key);
  },

  async setItem(key: string, value: string): Promise<void> {
    if (isNativeStorageAvailable()) {
      try {
        await Storage.setItem(key, value);
      } catch (error) {
        console.warn("[Repository] native Storage.setItem failed, falling back", error);
      }
    }
    writeToLocal(key, value);
  },

  async removeItem(key: string): Promise<void> {
    if (isNativeStorageAvailable()) {
      try {
        await Storage.removeItem(key);
      } catch (error) {
        console.warn("[Repository] native Storage.removeItem failed, falling back", error);
      }
    }
    removeFromLocal(key);
  },
};
