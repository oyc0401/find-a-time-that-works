import { ApiProperty } from "@nestjs/swagger";
import { RoomDto, ParticipantAvailabilityDto, OverlapSlotDto } from "../../dto";

export class RoomDetailResponseDto {
  @ApiProperty({ type: RoomDto })
  room: RoomDto;

  @ApiProperty({ type: [ParticipantAvailabilityDto] })
  participants: ParticipantAvailabilityDto[];
}

export class CreateRoomResponseDto {
  @ApiProperty({ example: "aB3kZ9xQ" })
  id: string;
}

export class SubmitAvailabilityResponseDto {
  @ApiProperty({ example: "aB3kZ9xQ" })
  participantId: string;
}

export class OverlapResponseDto {
  @ApiProperty({ example: 5, description: "총 참여자 수" })
  totalParticipants: number;

  @ApiProperty({ type: [OverlapSlotDto] })
  slots: OverlapSlotDto[];
}

export class ExtendRoomResponseDto {
  @ApiProperty({ example: "2026-04-10T00:00:00.000Z", description: "새 만료 일시" })
  expiresAt: string;
}
