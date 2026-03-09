# Frontend 규칙 및 로직 정리

---

## 닉네임 체계

### 닉네임 종류 (3가지)

| 이름 | 출처 | 설명 |
|------|------|------|
| generatedNickname | 로컬 저장소 | 최초 1회 랜덤 생성, 이후 불변. 닉네임 미설정 시 기본 이름으로 사용 |
| savedNickname | 로컬 저장소 | 사용자가 "다음에도 기억하기" 체크 후 저장한 이름. 없을 수 있음 |
| nickname | 서버 participant.name | 해당 방에서 실제 표시되는 이름 |

### 저장소 계층

- **Repository** (로컬 저장소 직접 접근): `getSavedNickname`, `setSavedNickname`, `getGeneratedNickname`, `setGeneratedNickname`
- **nickname.ts** (비즈니스 로직 + 메모리 캐싱): Repository 위 캐시 레이어. `getNickname()`은 savedNickname이 있으면 반환, 없으면 generatedNickname 반환
- **useRoomStore** (Zustand): 방 진입 후 런타임 상태. nickname, generatedNickname 보관 (savedNickname은 store에 넣지 않음)

---

## 메인 페이지 ( / )

- 처음 들어가면 본인의 userId가 없으면 생성
- 본인의 generatedNickname이 없으면 랜덤 생성 후 로컬에 저장
- 방 만들기 시 제목(name)은 null로 전송
- 방 만들기 시 creatorName도 함께 전송: savedNickname이 있으면 savedNickname, 없으면 generatedNickname
- 백엔드에서 방 생성 시 creator를 participant에 자동 추가

---

## 방 페이지 ( /rooms/:id )

### 진입 시 초기화

1. 로컬에서 savedNickname 조회 (없으면 undefined)
2. 로컬에서 generatedNickname 조회 (없으면 랜덤 생성 후 저장)
3. 서버에서 내 participant 조회
4. store에 세팅:
   - **store.nickname** = 서버 participant.name → savedNickname → generatedNickname 순서로 첫 번째 존재하는 값
   - **store.generatedNickname** = 로컬 generatedNickname

### 방 제목 표시

- 서버에서 room.name이 있으면 그대로 표시
- room.name이 없으면 participants에서 creatorId로 주인을 찾아 "{주인이름}의 방" / "{주인이름}'s Room" 형식으로 표시 (i18n: home.roomNameSuffix)

---

## 닉네임 수정 바텀시트

### 열 때

- nickname과 generatedNickname이 같으면 → 입력창 비움, placeholder에 generatedNickname 표시
- nickname과 generatedNickname이 다르면 → 입력창에 nickname 채움, placeholder는 기본 문구 ("이름을 입력해주세요")

### 저장 시

- store.nickname 업데이트 (표시용)
- "다음에도 기억하기" 플래그를 로컬 저장소에 저장
- "다음에도 기억하기" 체크 시 → 로컬 저장소에 savedNickname도 저장

---

## 서버 전송 (가용 시간 제출)

- participantName으로 store.nickname을 전송
