import {
  share,
  getTossShareLink,
  getOperationalEnvironment,
} from "@apps-in-toss/web-framework";

const scheme =
  getOperationalEnvironment() === "sandbox" ? "intoss-private" : "intoss";

export async function handleShare(roomId: string) {
  const tossLink = await getTossShareLink(
    `${scheme}://findtime/rooms/${roomId}&_deploymentId=019c272f-86d2-7809-aa05-50fb2cbd90d0`,
    "https://static.toss.im/appsintoss/2205/0f06f97b-5716-4b73-b40a-b52480eeb70c.png",
  );

  await share({ message: tossLink });
}
// intoss-private://findtime?_deploymentId=019c1d7d-e97c-774a-96af-4080d991ac26
// intoss-private://findtime/rooms?id=axTu4U1j&_deploymentId=019c1d7d-e97c-774a-96af-4080d991ac26
