import { generateHapticFeedback as tossHaptic } from "@apps-in-toss/web-framework";

type HapticsOptions = Parameters<typeof tossHaptic>[0];

function isHapticsAvailable() {
  if (typeof window === "undefined") return false;
  return typeof (window as { ReactNativeWebView?: unknown }).ReactNativeWebView !== "undefined";
}

export function generateHapticFeedback(options: HapticsOptions) {
  if (!isHapticsAvailable()) return;
  try {
    tossHaptic(options);
  } catch (error) {
    console.warn("[Haptics] native haptic call failed", error);
  }
}
