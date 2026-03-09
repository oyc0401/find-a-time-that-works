import {
  setClipboardText,
  SetClipboardTextPermissionError,
} from "@apps-in-toss/web-framework";

function isNativeClipboardAvailable() {
  if (typeof window === "undefined") return false;
  return typeof (window as { ReactNativeWebView?: unknown }).ReactNativeWebView !== "undefined";
}

async function writeViaNavigator(text: string) {
  if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(text);
    return true;
  }
  return false;
}

function fallbackCopyCommand(text: string) {
  if (typeof document === "undefined") return false;
  const textarea = document.createElement("textarea");
  textarea.value = text;
  textarea.style.position = "fixed";
  textarea.style.left = "-9999px";
  document.body.appendChild(textarea);
  textarea.focus();
  textarea.select();
  try {
    document.execCommand("copy");
    return true;
  } catch {
    return false;
  } finally {
    document.body.removeChild(textarea);
  }
}

export async function copyToClipboard(text: string) {
  try {
    if (isNativeClipboardAvailable()) {
      await setClipboardText(text);
      return;
    }
    if (await writeViaNavigator(text)) return;
    if (fallbackCopyCommand(text)) return;
    throw new Error("No clipboard API available");
  } catch (error) {
    if (
      error instanceof SetClipboardTextPermissionError ||
      (error as { message?: string } | undefined)?.message?.includes("clipboard")
    ) {
      console.error("클립보드 쓰기 권한 없음");
      return;
    }
    console.error("Clipboard copy failed", error);
    if ((await writeViaNavigator(text)) || fallbackCopyCommand(text)) {
      console.info("Copied via fallback clipboard");
    }
  }
}
