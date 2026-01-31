# FindTime

겹치는 시간을 찾아주는 일정 조율 앱. MVP 단계에서는 [when2meet](https://www.when2meet.com)과 기능적으로 동일하다.

## 프로젝트 개요

여러 사람이 공통으로 가능한 시간대를 시각적으로 찾을 수 있는 서비스.
방을 만들고 링크를 공유하면, 참여자들이 각자 가능한 시간을 입력하고, 겹치는 시간을 한눈에 확인할 수 있다.

## 핵심 기능 (MVP)

### 1. 방 생성
- 방 이름, 대상 날짜 리스트, 시간 범위(시작~종료), 제작자 정보를 입력하면 UUID를 반환
- 예: "팀 회의", 날짜 [2026-03-04, 2026-03-05], 시간 14:00~21:00

### 2. 가용 시간 입력
- 특정 방에 참여자가 자신의 가능한 시간대를 30분 단위로 입력
- 참여자는 이름(닉네임)으로 식별

### 3. 겹치는 시간 조회
- 모든 참여자의 가용 시간을 종합하여 겹치는 시간대를 시각화
- 특정 시간 슬롯을 선택하면 해당 시간에 가능한 참여자 목록을 표시

## 기술 스택

| 영역 | 기술 |
|------|------|
| Frontend | Next.js, React, TypeScript, Tailwind CSS, Zustand, Tanstack Query, Orval |
| Backend | NestJS, TypeScript, Prisma |
| Database | PostgreSQL |
| Monorepo | pnpm workspace |

## 프로젝트 구조

```
findtime/
├── pnpm-workspace.yaml
├── package.json          (root, private)
├── frontend/             (Vite + React + TypeScript)
└── backend/              (NestJS + Prisma)
```

## 데이터 모델

### Room (방)
| 필드 | 타입 | 설명 |
|------|------|------|
| id | UUID | PK, 자동 생성 |
| name | string | 방 이름 |
| creatorId | string | 제작자 외부 UUID |
| dates | date[] | 대상 날짜 리스트 |
| startTime | string | 하루 시작 시각 (e.g. "14:00") |
| endTime | string | 하루 종료 시각 (e.g. "21:00") |
| createdAt | datetime | 생성 시각 |

### Participant (참여자)
| 필드 | 타입 | 설명 |
|------|------|------|
| id | UUID | PK, 자동 생성 |
| roomId | UUID | FK → Room |
| name | string | 참여자 이름(닉네임) |
| createdAt | datetime | 참여 시각 |

### Availability (가용 시간)
| 필드 | 타입 | 설명 |
|------|------|------|
| id | UUID | PK, 자동 생성 |
| participantId | UUID | FK → Participant |
| date | date | 날짜 |
| startTime | string | 슬롯 시작 시각 (e.g. "14:00") |
| endTime | string | 슬롯 종료 시각 (e.g. "14:30") |

> 30분 단위 슬롯으로 관리. 예: 14:00~16:00 가능이면 → 14:00-14:30, 14:30-15:00, 15:00-15:30, 15:30-16:00 4개 레코드.

## API 엔드포인트 (MVP)

### 방
| Method | Path | 설명 |
|--------|------|------|
| POST | `/rooms` | 방 생성 → UUID 반환 |
| GET | `/rooms/:id` | 방 정보 + 참여자 + 가용 시간 전체 조회 |

### 참여자 & 가용 시간
| Method | Path | 설명 |
|--------|------|------|
| POST | `/rooms/:id/availability` | 참여자 이름 + 가용 시간 슬롯 일괄 입력 |
| PUT | `/rooms/:id/availability/:participantId` | 기존 참여자의 가용 시간 수정 |

### 결과 조회
| Method | Path | 설명 |
|--------|------|------|
| GET | `/rooms/:id/overlap` | 겹치는 시간대 + 각 슬롯별 가능 인원 수/목록 |

## 로컬 개발

```bash
# 의존성 설치
pnpm install

# 개발 서버 (프론트 3000 + 백엔드 3001)
pnpm dev
```
