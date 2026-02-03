import { TossRepository } from "./toss-repository";
import { generateRandomNameKo, generateRandomNameEn } from "../lib/randomName";
import i18n from "@/i18n";

const DEFAULT_NAME_KEY = "defaultName";
let cachedDefaultName: string | undefined;

/** 디폴트 이름 조회. 없으면 랜덤 생성 후 저장. 결과는 캐시됨 */
export async function getDefaultName(): Promise<string> {
  if (cachedDefaultName) return cachedDefaultName;

  const existing = await TossRepository.getItem(DEFAULT_NAME_KEY);
  if (existing) {
    cachedDefaultName = existing;
    return existing;
  }

  const name =
    i18n.language === "ko" ? generateRandomNameKo() : generateRandomNameEn();
  await TossRepository.setItem(DEFAULT_NAME_KEY, name);
  cachedDefaultName = name;
  return name;
}

/** 디폴트 이름 변경 */
export async function setDefaultName(name: string): Promise<void> {
  await TossRepository.setItem(DEFAULT_NAME_KEY, name);
  cachedDefaultName = name;
}

const REMEMBER_NAME_KEY = "rememberName";
let cachedRememberName: boolean | undefined;

/** "다음에도 기억하기" 설정 조회. 없으면 true */
export async function getRememberName(): Promise<boolean> {
  if (cachedRememberName !== undefined) return cachedRememberName;

  const existing = await TossRepository.getItem(REMEMBER_NAME_KEY);
  cachedRememberName = existing === null ? true : existing === "true";
  return cachedRememberName;
}

/** "다음에도 기억하기" 설정 저장 */
export async function setRememberName(value: boolean): Promise<void> {
  await TossRepository.setItem(REMEMBER_NAME_KEY, value ? "true" : "false");
  cachedRememberName = value;
}
