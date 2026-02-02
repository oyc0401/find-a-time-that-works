import { ApiProperty } from "@nestjs/swagger";
import { SlotDto } from "./slot.dto";

export class ParticipantDto {
  @ApiProperty({ example: "aB3kZ9xQ" })
  id: string;

  @ApiProperty({ example: "550e8400-e29b-41d4-a716-446655440000" })
  userId: string;

  @ApiProperty({ example: "유찬" })
  name: string;

  @ApiProperty({ example: "https://example.com/thumb.png", required: false })
  thumbnail?: string;

  @ApiProperty({ type: [SlotDto] })
  slots: SlotDto[];
}
