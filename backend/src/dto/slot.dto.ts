import { ApiProperty } from "@nestjs/swagger";
import { IsString, Matches } from "class-validator";

export class SlotDto {
  @ApiProperty({ example: "2026-03-04", description: "날짜 (YYYY-MM-DD)" })
  @IsString()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: "날짜는 YYYY-MM-DD 형식이어야 합니다" })
  date: string;

  @ApiProperty({ example: "14:00", description: "슬롯 시작 시각 (HH:mm, 00분 또는 30분)" })
  @IsString()
  @Matches(/^\d{2}:(00|30)$/, { message: "시각은 HH:00 또는 HH:30 형식이어야 합니다" })
  time: string;
}
