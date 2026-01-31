import { ApiProperty } from "@nestjs/swagger";
import { SlotDto } from "./slot.dto";

export class RoomDto {
  @ApiProperty({ example: "aB3kZ9xQ" })
  id: string;

  @ApiProperty({ example: "팀 회의" })
  name: string;

  @ApiProperty({ example: "user-uuid-1234" })
  creatorId: string;

  @ApiProperty({ example: ["2026-03-04", "2026-03-05"] })
  dates: string[];

  @ApiProperty({ example: "14:00" })
  startTime: string;

  @ApiProperty({ example: "21:00" })
  endTime: string;

  @ApiProperty({ example: "2026-03-01T00:00:00.000Z" })
  createdAt: string;

  @ApiProperty({ example: "2026-03-11T00:00:00.000Z" })
  expiresAt: string;
}

export class ParticipantAvailabilityDto {
  @ApiProperty({ example: "aB3kZ9xQ" })
  id: string;

  @ApiProperty({ example: "550e8400-e29b-41d4-a716-446655440000" })
  userId: string;

  @ApiProperty({ example: "유찬" })
  name: string;

  @ApiProperty({ type: [SlotDto] })
  slots: SlotDto[];
}

export class OverlapSlotDto {
  @ApiProperty({ example: "2026-03-04" })
  date: string;

  @ApiProperty({ example: "14:00" })
  time: string;

  @ApiProperty({ example: 3 })
  count: number;

  @ApiProperty({ example: ["유찬", "민수", "지영"] })
  participants: string[];
}
