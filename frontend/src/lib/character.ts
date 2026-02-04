// 캐릭터 데이터 (이미지 + 이름 매핑)
export const CHARACTERS = [
  { image: "u1F31D-texture", nameKo: "달님", nameEn: "Moon" },
  { image: "u1F438", nameKo: "개구리", nameEn: "Frog" },
  { image: "u1F981", nameKo: "사자", nameEn: "Lion" },
  { image: "u1F31E", nameKo: "햇님", nameEn: "Sun" },
  { image: "u1F43B_u200D_u2744_uFE0F", nameKo: "북극곰", nameEn: "Polar Bear" },
  { image: "u1F98A", nameKo: "여우", nameEn: "Fox" },
  { image: "u1F428", nameKo: "코알라", nameEn: "Koala" },
  { image: "u26C4", nameKo: "눈사람", nameEn: "Snowman" },
  { image: "u1F42E", nameKo: "젖소", nameEn: "Cow" },
  { image: "u1F436", nameKo: "강아지", nameEn: "Dog" },
  { image: "u1F42F", nameKo: "호랑이", nameEn: "Tiger" },
  { image: "u1F43C", nameKo: "판다", nameEn: "Panda" },
  { image: "u1F435", nameKo: "원숭이", nameEn: "Monkey" },
  { image: "u1F42C", nameKo: "돌고래", nameEn: "Dolphin" },
  { image: "u1F419", nameKo: "문어", nameEn: "Octopus" },
  { image: "u1F431", nameKo: "고양이", nameEn: "Cat" },
  { image: "u1F430", nameKo: "토끼", nameEn: "Rabbit" },
  { image: "u1F989", nameKo: "올빼미", nameEn: "Owl" },
  { image: "u1F425", nameKo: "병아리", nameEn: "Chick" },
  { image: "u1F437", nameKo: "돼지", nameEn: "Pig" },
  { image: "u1F439", nameKo: "햄스터", nameEn: "Hamster" },
  { image: "u1F42D", nameKo: "생쥐", nameEn: "Mouse" },
  { image: "u1F43B", nameKo: "곰돌이", nameEn: "Bear" },
  { image: "u1FACE", nameKo: "순록", nameEn: "Moose" },
] as const;

export type Character = (typeof CHARACTERS)[number];

// 톤: 신뢰/깔끔/친근 (Toss-like)
const ADJECTIVES = [
  { ko: "빠른", en: "Fast" },
  { ko: "경쾌한", en: "Crisp" },
  { ko: "산뜻한", en: "Fresh" },
  { ko: "명확한", en: "Clear" },
  { ko: "선명한", en: "Vivid" },
  { ko: "정확한", en: "Exact" },
  { ko: "깔끔한", en: "Neat" },
  { ko: "정돈된", en: "Tidy" },
  { ko: "단정한", en: "Precise" },
  { ko: "담백한", en: "Simple" },
  { ko: "든든한", en: "Reliable" },
  { ko: "튼튼한", en: "Sturdy" },
  { ko: "안정적인", en: "Steady" },
  { ko: "단단한", en: "Solid" },
  { ko: "친절한", en: "Kind" },
  { ko: "상냥한", en: "Friendly" },
  { ko: "다정한", en: "Gentle" },
  { ko: "포근한", en: "Cozy" },
  { ko: "차분한", en: "Calm" },
  { ko: "침착한", en: "Composed" },
  { ko: "밝은", en: "Bright" },
  { ko: "민첩한", en: "Agile" },
  { ko: "유연한", en: "Flexible" },
  { ko: "정교한", en: "Refined" },
  { ko: "똑똑한", en: "Smart" },
] as const;

function pickRandomAdjective() {
  return ADJECTIVES[Math.floor(Math.random() * ADJECTIVES.length)];
}

export function pickRandomCharacter(): Character {
  return CHARACTERS[Math.floor(Math.random() * CHARACTERS.length)];
}

export function generateRandomNameKo(character: Character): string {
  return `${pickRandomAdjective().ko} ${character.nameKo}`;
}

export function generateRandomNameEn(character: Character): string {
  return `${pickRandomAdjective().en} ${character.nameEn}`;
}
