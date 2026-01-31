import { ApiProperty } from "@nestjs/swagger";
import { IsString, IsArray, ValidateNested } from "class-validator";
import { Type } from "class-transformer";
import { SlotDto } from "../../dto";

export class SubmitAvailabilityDto {
  @ApiProperty({ example: "유찬" })
  @IsString()
  participantName: string;

  @ApiProperty({
    type: [SlotDto],
    example: [
      { date: "2026-03-04", time: "14:00" },
      { date: "2026-03-04", time: "14:30" },
    ],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SlotDto)
  slots: SlotDto[];
}
