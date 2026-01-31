import { ApiProperty } from "@nestjs/swagger";
import { RoomDto, ParticipantDto } from "../../dto";

// === Nested DTOs for Swagger ===

class CreateRoomDataDto {
  @ApiProperty({ example: "aB3kZ9xQ" })
  id: string;
}

class RoomDetailDataDto {
  @ApiProperty({ type: RoomDto })
  room: RoomDto;

  @ApiProperty({ type: [ParticipantDto] })
  participants: ParticipantDto[];
}

class ExtendRoomDataDto {
  @ApiProperty({ example: "2026-04-10T00:00:00.000Z" })
  expiresAt: string;
}

// === API Response DTOs ===

export class CreateRoomApiResponseDto {
  @ApiProperty({ type: CreateRoomDataDto })
  data: CreateRoomDataDto;

  @ApiProperty({ example: "방이 생성되었습니다" })
  message: string;
}

export class RoomDetailApiResponseDto {
  @ApiProperty({ type: RoomDetailDataDto })
  data: RoomDetailDataDto;

  @ApiProperty({ example: "조회 성공" })
  message: string;
}

export class SubmitAvailabilityApiResponseDto {
  @ApiProperty({ example: null, nullable: true, type: "null" })
  data: null;

  @ApiProperty({ example: "가용 시간이 저장되었습니다" })
  message: string;
}

export class ExtendRoomApiResponseDto {
  @ApiProperty({ type: ExtendRoomDataDto })
  data: ExtendRoomDataDto;

  @ApiProperty({ example: "만료 기간이 연장되었습니다" })
  message: string;
}

export class DeleteRoomApiResponseDto {
  @ApiProperty({ example: null, nullable: true, type: "null" })
  data: null;

  @ApiProperty({ example: "방이 삭제되었습니다" })
  message: string;
}

export class UpdateRoomNameApiResponseDto {
  @ApiProperty({ example: null, nullable: true, type: "null" })
  data: null;

  @ApiProperty({ example: "방 이름이 변경되었습니다" })
  message: string;
}

export class UpdateNicknameApiResponseDto {
  @ApiProperty({ example: null, nullable: true, type: "null" })
  data: null;

  @ApiProperty({ example: "닉네임이 변경되었습니다" })
  message: string;
}

// === Legacy exports for backward compatibility (서비스 레이어용) ===
export type CreateRoomResponseDto = { id: string };
export type RoomDetailResponseDto = RoomDetailApiResponseDto["data"];
export type ExtendRoomResponseDto = { expiresAt: string };
