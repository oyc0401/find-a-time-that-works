import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsString, IsArray, Matches, ArrayMinSize, IsOptional } from "class-validator";

export class CreateRoomDto {
  @ApiPropertyOptional({ example: "팀 회의" })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiProperty({ example: "user-uuid-1234" })
  @IsString()
  creatorId: string;

  @ApiProperty({ example: "홍길동", description: "방 생성자 닉네임" })
  @IsString()
  creatorName: string;

  @ApiProperty({
    example: ["2026-03-04", "2026-03-05"],
    description: "대상 날짜 리스트 (YYYY-MM-DD)",
  })
  @IsArray()
  @ArrayMinSize(1)
  @IsString({ each: true })
  @Matches(/^\d{4}-\d{2}-\d{2}$/, { each: true, message: "날짜는 YYYY-MM-DD 형식이어야 합니다" })
  dates: string[];

  @ApiProperty({ example: "14:00", description: "시작 시각 (HH:mm)" })
  @IsString()
  @Matches(/^\d{2}:\d{2}$/, { message: "시각은 HH:mm 형식이어야 합니다" })
  startTime: string;

  @ApiProperty({ example: "21:00", description: "종료 시각 (HH:mm)" })
  @IsString()
  @Matches(/^\d{2}:\d{2}$/, { message: "시각은 HH:mm 형식이어야 합니다" })
  endTime: string;
}
