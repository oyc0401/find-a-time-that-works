# Backend API 엔드포인트

Base URL: `http://localhost:3001`
Swagger: `http://localhost:3001/api`

## Rooms

| Method | Path                       | 설명                                    |
|--------|----------------------------|----------------------------------------|
| POST   | /rooms                     | 방 생성 (8자 ID 반환)                      |
| GET    | /rooms/:id                 | 방 상세 조회 (participants[].slots 포함)    |
| POST   | /rooms/:id/availability    | 가용 시간 입력 (같은 UUID면 덮어쓰기)          |
| POST   | /rooms/:id/extend          | 만료 기간 30일 연장                        |
| DELETE | /rooms/:id                 | 방 삭제 (creatorId 검증)                   |
| PATCH  | /rooms/:id                 | 방 이름 변경 (creatorId 검증)               |
| PATCH  | /rooms/:id/nickname        | 특정 방에서 유저 닉네임 변경                  |
