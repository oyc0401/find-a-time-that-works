import {
  share as tossShare,
  getTossShareLink,
  getOperationalEnvironment,
} from "@apps-in-toss/web-framework";
import { copyToClipboard } from "./clipboard";

const DEPLOYMENT_ID = "019c272f-86d2-7809-aa05-50fb2cbd90d0";

function isNativeShareAvailable() {
  if (typeof window === "undefined") return false;
  return typeof (window as { ReactNativeWebView?: unknown }).ReactNativeWebView !== "undefined";
}

function getBrowserShareUrl(roomId: string) {
  if (typeof window === "undefined") {
    return `https://findtime.toss.im/rooms/${roomId}`;
  }
  return `${window.location.origin}/rooms/${roomId}`;
}

async function shareInBrowser(roomId: string) {
  const url = getBrowserShareUrl(roomId);
  if (navigator.share) {
    try {
      await navigator.share({ url, text: url });
      return;
    } catch (error) {
      console.warn("[Share] navigator.share 실패, 클립보드로 대체", error);
    }
  }
  await copyToClipboard(url);
  if (typeof window !== "undefined") {
    window.alert("링크가 복사되었습니다.");
  }
}

export async function handleShare(roomId: string) {
  if (!isNativeShareAvailable()) {
    await shareInBrowser(roomId);
    return;
  }

  try {
    const scheme =
      getOperationalEnvironment() === "sandbox" ? "intoss-private" : "intoss";

    const tossLink = await getTossShareLink(
      `${scheme}://findtime/rooms/${roomId}&_deploymentId=${DEPLOYMENT_ID}`,
      "https://static.toss.im/appsintoss/2205/0f06f97b-5716-4b73-b40a-b52480eeb70c.png",
    );

    await tossShare({ message: tossLink });
  } catch (error) {
    console.warn("[Share] native share 실패, 브라우저 공유로 대체", error);
    await shareInBrowser(roomId);
  }
}
