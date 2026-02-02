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
