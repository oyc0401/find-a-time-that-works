import { ApiProperty } from "@nestjs/swagger";
import { IsString, IsArray, ValidateNested, Matches } from "class-validator";
import { Type } from "class-transformer";

export class AvailabilitySlotDto {
  @ApiProperty({ example: "2026-03-04", description: "날짜 (YYYY-MM-DD)" })
  @IsString()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: "날짜는 YYYY-MM-DD 형식이어야 합니다" })
  date: string;

  @ApiProperty({ example: "14:00", description: "슬롯 시작 시각 (HH:mm, 00분 또는 30분)" })
  @IsString()
  @Matches(/^\d{2}:(00|30)$/, { message: "시각은 HH:00 또는 HH:30 형식이어야 합니다" })
  time: string;
}

export class SubmitAvailabilityDto {
  @ApiProperty({ example: "550e8400-e29b-41d4-a716-446655440000", description: "프론트에서 생성한 UUID" })
  @IsString()
  participantId: string;

  @ApiProperty({ example: "유찬" })
  @IsString()
  participantName: string;

  @ApiProperty({
    type: [AvailabilitySlotDto],
    example: [
      { date: "2026-03-04", time: "14:00" },
      { date: "2026-03-04", time: "14:30" },
    ],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AvailabilitySlotDto)
  slots: AvailabilitySlotDto[];
}
