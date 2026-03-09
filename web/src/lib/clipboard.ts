import {
  setClipboardText,
  SetClipboardTextPermissionError,
} from "@apps-in-toss/web-framework";

export async function copyToClipboard(text: string) {
  try {
    await setClipboardText(text);
  } catch (error) {
    if (error instanceof SetClipboardTextPermissionError) {
      console.error("클립보드 쓰기 권한 없음");
      return;
    }
    console.error(error);
  }
}
