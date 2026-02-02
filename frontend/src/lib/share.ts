import {
  share,
  getTossShareLink,
  getOperationalEnvironment,
} from "@apps-in-toss/web-framework";

const scheme =
  getOperationalEnvironment() === "sandbox" ? "intoss-private" : "intoss";

export async function handleShare(roomId: string) {
  const tossLink = await getTossShareLink(
    `${scheme}://findtime/room?id=${roomId}`,
    "https://static.toss.im/icons/png/4x/icon-share-dots-mono.png",
  );

  await share({ message: tossLink });
}
