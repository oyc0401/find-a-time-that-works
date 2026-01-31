import { ApiProperty } from "@nestjs/swagger";

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
