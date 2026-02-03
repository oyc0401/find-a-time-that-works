import { TossRepository } from "./toss-repository";

export const THUMBNAILS = [
  "u1F31D-texture",
  "u1F438",
  "u1F981",
  "u1F31E",
  "u1F43B_u200D_u2744_uFE0F",
  "u1F98A",
  "u1F428",
  "u1F31D",
  "u1F649",
  "u26C4",
  "u1F42E",
  "u1F436",
  "u1F42F",
  "u1F43C",
  "u1F435",
  "u1F42C",
  "u1F419",
  "u1F431",
  "u1F430",
  "u1F989",
  "u1F425",
  "u1F437",
  "u1F439",
  "u1F42D",
  "u1F43B",
  "u1FACE",
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

  const existing = await TossRepository.getItem(DEFAULT_THUMBNAIL_KEY);
  if (existing) {
    cachedDefaultThumbnail = existing;
    return existing;
  }

  const thumbnail = pickRandomThumbnail();
  await TossRepository.setItem(DEFAULT_THUMBNAIL_KEY, thumbnail);
  cachedDefaultThumbnail = thumbnail;
  return thumbnail;
}

/** 디폴트 썸네일 변경 */
export async function setDefaultThumbnail(thumbnail: string): Promise<void> {
  await TossRepository.setItem(DEFAULT_THUMBNAIL_KEY, thumbnail);
  cachedDefaultThumbnail = thumbnail;
}
