import { Repository } from "./repository";

export const THUMBNAILS = [
  "u1F31D-texture",
  "u1F438",
  "u1F981",
  "u1F31E",
] as const;

export type ThumbnailId = (typeof THUMBNAILS)[number];

const FALLBACK_URL = "https://static.toss.im/icons/svg/icon-user.svg";

export function thumbnailUrl(id?: string): string {
  if (!id) return FALLBACK_URL;
  return `https://static.toss.im/2d-emojis/svg/${id}.svg`;
}

function pickRandomThumbnail(): ThumbnailId {
  return THUMBNAILS[Math.floor(Math.random() * THUMBNAILS.length)];
}

const DEFAULT_THUMBNAIL_KEY = "defaultThumbnail";
let cachedDefaultThumbnail: string | undefined;

/** 디폴트 썸네일 조회. 없으면 랜덤 생성 후 저장. 결과는 캐시됨 */
export async function getDefaultThumbnail(): Promise<string> {
  if (cachedDefaultThumbnail) return cachedDefaultThumbnail;

  const existing = await Repository.getItem(DEFAULT_THUMBNAIL_KEY);
  if (existing) {
    cachedDefaultThumbnail = existing;
    return existing;
  }

  const thumbnail = pickRandomThumbnail();
  await Repository.setItem(DEFAULT_THUMBNAIL_KEY, thumbnail);
  cachedDefaultThumbnail = thumbnail;
  return thumbnail;
}

/** 디폴트 썸네일 변경 */
export async function setDefaultThumbnail(thumbnail: string): Promise<void> {
  await Repository.setItem(DEFAULT_THUMBNAIL_KEY, thumbnail);
  cachedDefaultThumbnail = thumbnail;
}
