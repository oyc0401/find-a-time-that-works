import {
  share,
  getTossShareLink,
  getOperationalEnvironment,
} from "@apps-in-toss/web-framework";

const scheme =
  getOperationalEnvironment() === "sandbox" ? "intoss-private" : "intoss";

export async function handleShare(roomId: string) {
  const tossLink = await getTossShareLink(
    `${scheme}://findtime/rooms/${roomId}&_deploymentId=019c1d7d-e97c-774a-96af-4080d991ac26`,
    "https://static.toss.im/icons/png/4x/icon-share-dots-mono.png",
  );

  await share({ message: tossLink });
}
// intoss-private://findtime?_deploymentId=019c1d7d-e97c-774a-96af-4080d991ac26
// intoss-private://findtime/rooms?id=axTu4U1j&_deploymentId=019c1d7d-e97c-774a-96af-4080d991ac26
