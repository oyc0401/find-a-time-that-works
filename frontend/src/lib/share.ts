import { share, getTossShareLink } from "@apps-in-toss/web-framework";

export async function handleShare(roomId: string) {
  const tossLink = await getTossShareLink(
    `intoss://findtime/room?id=${roomId}`,
    "https://static.toss.im/icons/png/4x/icon-share-dots-mono.png",
  );

  await share({ message: tossLink });
}
