import { Repository } from "./repository";
import { CHARACTERS } from "../lib/character";
import { getDefaultProfile, invalidateProfileCache } from "./profile";

export const THUMBNAILS = CHARACTERS.map((c) => c.image);

export type ThumbnailId = (typeof THUMBNAILS)[number];

const FALLBACK_URL = "https://static.toss.im/icons/svg/icon-user.svg";

export function thumbnailUrl(id?: string): string {
  if (!id) return FALLBACK_URL;
  return `https://static.toss.im/2d-emojis/svg/${id}.svg`;
}

/** 디폴트 썸네일 조회. 없으면 랜덤 생성 후 저장 */
export async function getDefaultThumbnail(): Promise<string> {
  const profile = await getDefaultProfile();
  return profile.thumbnail;
}

/** 디폴트 썸네일 변경 */
export async function setDefaultThumbnail(thumbnail: string): Promise<void> {
  await Repository.setDefaultThumbnail(thumbnail);
  invalidateProfileCache();
}
