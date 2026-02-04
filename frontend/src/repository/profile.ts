import { Repository } from "./repository";
import {
  pickRandomCharacter,
  generateRandomNameKo,
  generateRandomNameEn,
} from "../lib/character";
import i18n from "@/i18n";

export interface DefaultProfile {
  nickname: string;
  thumbnail: string;
}

let cachedProfile: DefaultProfile | undefined;

/** 캐시 무효화 (썸네일 변경 시 사용) */
export function invalidateProfileCache(): void {
  cachedProfile = undefined;
}

/** 디폴트 프로필(닉네임 + 썸네일) 조회. 없으면 랜덤 생성 후 저장. 최초 1회만 생성되며 이후 불변 */
export async function getDefaultProfile(): Promise<DefaultProfile> {
  if (cachedProfile) return cachedProfile;

  const [existingNickname, existingThumbnail] = await Promise.all([
    Repository.getGeneratedNickname(),
    Repository.getDefaultThumbnail(),
  ]);

  if (existingNickname && existingThumbnail) {
    cachedProfile = { nickname: existingNickname, thumbnail: existingThumbnail };
    return cachedProfile;
  }

  const character = pickRandomCharacter();
  const nickname =
    i18n.language === "ko"
      ? generateRandomNameKo(character)
      : generateRandomNameEn(character);
  const thumbnail = character.image;

  await Promise.all([
    Repository.setGeneratedNickname(nickname),
    Repository.setDefaultThumbnail(thumbnail),
  ]);

  cachedProfile = { nickname, thumbnail };
  return cachedProfile;
}
