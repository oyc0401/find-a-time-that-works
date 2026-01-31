# Backend API 엔드포인트

Base URL: `http://localhost:3001`
Swagger: `http://localhost:3001/api`

## Rooms

| Method | Path                       | 설명                                    |
|--------|----------------------------|----------------------------------------|
| POST   | /rooms                     | 방 생성 (8자 ID 반환)                      |
| GET    | /rooms/:id                 | 방 상세 조회                              |
| POST   | /rooms/:id/availability    | 가용 시간 입력 (같은 UUID면 덮어쓰기)          |
| GET    | /rooms/:id/overlap         | 겹치는 시간 조회 (?participantId= 필터)     |
| POST   | /rooms/:id/extend          | 만료 기간 30일 연장                        |
