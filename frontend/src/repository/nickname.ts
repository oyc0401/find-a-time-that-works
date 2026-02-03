import { Repository } from "./repository";
import { generateRandomNameKo, generateRandomNameEn } from "../lib/randomName";
import i18n from "@/i18n";

let cachedGeneratedNickname: string | undefined;

/** 생성된 닉네임 조회. 없으면 랜덤 생성 후 저장. 결과는 캐시됨 */
export async function getGeneratedNickname(): Promise<string> {
  if (cachedGeneratedNickname) return cachedGeneratedNickname;

  const existing = await Repository.getGeneratedNickname();
  if (existing) {
    cachedGeneratedNickname = existing;
    return existing;
  }

  const name =
    i18n.language === "ko" ? generateRandomNameKo() : generateRandomNameEn();
  await Repository.setGeneratedNickname(name);
  cachedGeneratedNickname = name;
  return name;
}

/** 생성된 닉네임 변경 */
export async function setGeneratedNickname(name: string): Promise<void> {
  await Repository.setGeneratedNickname(name);
  cachedGeneratedNickname = name;
}

let cachedRememberName: boolean | undefined;

/** "다음에도 기억하기" 설정 조회. 없으면 true */
export async function getRememberName(): Promise<boolean> {
  if (cachedRememberName !== undefined) return cachedRememberName;

  const existing = await Repository.getRememberName();
  cachedRememberName = existing === undefined ? true : existing === "true";
  return cachedRememberName;
}

/** "다음에도 기억하기" 설정 저장 */
export async function setRememberName(value: boolean): Promise<void> {
  await Repository.setRememberName(value ? "true" : "false");
  cachedRememberName = value;
}
