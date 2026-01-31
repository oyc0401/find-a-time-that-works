import { ApiProperty } from "@nestjs/swagger";
import { RoomDto, ParticipantDto } from "../../dto";

export class RoomDetailResponseDto {
  @ApiProperty({ type: RoomDto })
  room: RoomDto;

  @ApiProperty({ type: [ParticipantDto] })
  participants: ParticipantDto[];
}

export class CreateRoomResponseDto {
  @ApiProperty({ example: "aB3kZ9xQ" })
  id: string;
}

export class SubmitAvailabilityResponseDto {
  @ApiProperty({ example: "aB3kZ9xQ" })
  participantId: string;
}

export class ExtendRoomResponseDto {
  @ApiProperty({ example: "2026-04-10T00:00:00.000Z", description: "새 만료 일시" })
  expiresAt: string;
}

export class UpdateRoomNameResponseDto {
  @ApiProperty({ example: "새 회의 이름", description: "변경된 방 이름" })
  name: string;
}

export class UpdateNicknameResponseDto {
  @ApiProperty({ example: "participant-uuid-1234", description: "참여자 ID" })
  participantId: string;

  @ApiProperty({ example: "새 닉네임", description: "변경된 닉네임" })
  name: string;
}
