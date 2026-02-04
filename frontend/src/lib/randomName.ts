// 톤: 신뢰/깔끔/친근 (Toss-like)
const koAdjectives = [
  // 속도/리듬(긍정)
  "빠른",
  "경쾌한",
  "산뜻한",

  // 선명/정돈/명료(토스 톤)
  "명확한",
  "선명한",
  "정확한",
  "깔끔한",
  "정돈된",
  "단정한",
  "담백한",

  // 안정/신뢰
  "든든한",
  "튼튼한",
  "안정적인",
  "단단한",

  // 친근/호감
  "친절한",
  "상냥한",
  "다정한",
  "포근한",
  "차분한",
  "침착한",
  "밝은",

  // 민첩/세련(과하지 않게)
  "민첩한",
  "유연한",
  "세련된",
  "정교한",
  "똑똑한",
];

const koNouns = [
  // 국민 친숙 라인
  "강아지",
  "고양이",
  "토끼",
  "햄스터",
  "판다",
  "코알라",
  "다람쥐",
  "고슴도치",
  "수달",
  "여우",
  "곰",
  "사슴",

  // 호불호 적은 “기분 좋은” 동물
  "펭귄",
  "돌고래",
  "기린",
  "코끼리",
  "오리",
  "백조",

  // 요즘 밈/대중 친숙도 괜찮은 편
  "카피바라",
];

export function generateRandomNameKo(): string {
  const adjective =
    koAdjectives[Math.floor(Math.random() * koAdjectives.length)];
  const noun = koNouns[Math.floor(Math.random() * koNouns.length)];
  return `${adjective} ${noun}`;
}

const enAdjectives = [
  // pace / vibe
  "Fast",
  "Crisp",
  "Fresh",

  // clarity / neatness (toss-like)
  "Clear",
  "Vivid",
  "Exact",
  "Precise",
  "Neat",
  "Tidy",
  "Simple",

  // stability / trust
  "Reliable",
  "Steady",
  "Solid",

  // friendly / warm
  "Bright",
  "Calm",
  "Kind",
  "Friendly",
  "Cozy",

  // sleek / agile (not aggressive)
  "Agile",
  "Flexible",
  "Sleek",
  "Smart",
];

const enNouns = [
  "Dog",
  "Cat",
  "Rabbit",
  "Hamster",
  "Panda",
  "Koala",
  "Squirrel",
  "Hedgehog",
  "Otter",
  "Fox",
  "Bear",
  "Deer",
  "Penguin",
  "Dolphin",
  "Giraffe",
  "Elephant",
  "Duck",
  "Swan",
  "Capybara",
];

export function generateRandomNameEn(): string {
  const adjective =
    enAdjectives[Math.floor(Math.random() * enAdjectives.length)];
  const noun = enNouns[Math.floor(Math.random() * enNouns.length)];
  return `${adjective} ${noun}`;
}
