import { Repository } from "./repository";
import { getDefaultProfile } from "./profile";

/** 랜덤 생성 닉네임 조회. 없으면 랜덤 생성 후 저장. 최초 1회만 생성되며 이후 불변 */
export async function getGeneratedNickname(): Promise<string> {
  const profile = await getDefaultProfile();
  return profile.nickname;
}

let cachedNickname: string | undefined;

/** 사용자가 저장한 닉네임 조회 */
export async function getSavedNickname(): Promise<string | undefined> {
  if (cachedNickname) return cachedNickname;

  const existing = await Repository.getSavedNickname();
  if (existing) {
    cachedNickname = existing;
    return existing;
  }

  return undefined;
}

/** 사용자가 저장한 닉네임 조회. 없으면 generatedNickname 반환 */
export async function getNickname(): Promise<string> {
  return (await getSavedNickname()) ?? (await getGeneratedNickname());
}

/** 사용자 닉네임 저장 */
export async function setSavedNickname(name: string): Promise<void> {
  await Repository.setSavedNickname(name);
  cachedNickname = name;
}

let cachedRememberNicknameFlag: boolean | undefined;

/** "다음에도 기억하기" 설정 조회. 없으면 true */
export async function getRememberNicknameFlag(): Promise<boolean> {
  if (cachedRememberNicknameFlag !== undefined) return cachedRememberNicknameFlag;

  const existing = await Repository.getRememberNicknameFlag();
  cachedRememberNicknameFlag = existing === undefined ? true : existing === "true";
  return cachedRememberNicknameFlag;
}

/** "다음에도 기억하기" 설정 저장 */
export async function setRememberNicknameFlag(value: boolean): Promise<void> {
  await Repository.setRememberNicknameFlag(value ? "true" : "false");
  cachedRememberNicknameFlag = value;
}
