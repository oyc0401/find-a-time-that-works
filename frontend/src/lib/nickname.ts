import { Repository } from "./repository";
import { generateRandomName } from "./randomName";

const DEFAULT_NAME_KEY = "defaultName";
let cachedDefaultName: string | undefined;

/** 디폴트 이름 조회. 없으면 랜덤 생성 후 저장. 결과는 캐시됨 */
export async function getDefaultName(): Promise<string> {
  if (cachedDefaultName) return cachedDefaultName;

  const existing = await Repository.getItem(DEFAULT_NAME_KEY);
  if (existing) {
    cachedDefaultName = existing;
    return existing;
  }

  const name = generateRandomName();
  await Repository.setItem(DEFAULT_NAME_KEY, name);
  cachedDefaultName = name;
  return name;
}

/** 디폴트 이름 변경 */
export async function setDefaultName(name: string): Promise<void> {
  await Repository.setItem(DEFAULT_NAME_KEY, name);
  cachedDefaultName = name;
}

const REMEMBER_NAME_KEY = "rememberName";
let cachedRememberName: boolean | undefined;

/** "다음에도 기억하기" 설정 조회. 없으면 true */
export async function getRememberName(): Promise<boolean> {
  if (cachedRememberName !== undefined) return cachedRememberName;

  const existing = await Repository.getItem(REMEMBER_NAME_KEY);
  cachedRememberName = existing === null ? true : existing === "true";
  return cachedRememberName;
}

/** "다음에도 기억하기" 설정 저장 */
export async function setRememberName(value: boolean): Promise<void> {
  await Repository.setItem(REMEMBER_NAME_KEY, value ? "true" : "false");
  cachedRememberName = value;
}
