import { Repository } from "./repository";
import { generateRandomName } from "./randomName";

const DEFAULT_NAME_KEY = "defaultName";
const roomNameKey = (roomId: string) => `name-${roomId}`;

let cachedDefaultName: string | undefined;
const cachedRoomNames = new Map<string, string>();

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

/** 특정 방의 닉네임 조회. 없으면 디폴트 이름을 저장 후 반환. 결과는 캐시됨 */
export async function getRoomName(roomId: string): Promise<string> {
  const cached = cachedRoomNames.get(roomId);
  if (cached) return cached;

  const existing = await Repository.getItem(roomNameKey(roomId));
  if (existing) {
    cachedRoomNames.set(roomId, existing);
    return existing;
  }

  const defaultName = await getDefaultName();
  await Repository.setItem(roomNameKey(roomId), defaultName);
  cachedRoomNames.set(roomId, defaultName);
  return defaultName;
}

/** 특정 방의 닉네임 변경 */
export async function setRoomName(
  roomId: string,
  name: string,
): Promise<void> {
  await Repository.setItem(roomNameKey(roomId), name);
  cachedRoomNames.set(roomId, name);
}
