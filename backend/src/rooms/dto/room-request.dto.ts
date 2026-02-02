import { ApiProperty } from "@nestjs/swagger";
import { IsString, IsOptional, MinLength } from "class-validator";

export class DeleteRoomDto {
  @ApiProperty({ example: "user-uuid-1234", description: "방 생성자 ID" })
  @IsString()
  creatorId: string;
}

export class UpdateRoomNameDto {
  @ApiProperty({ example: "user-uuid-1234", description: "방 생성자 ID" })
  @IsString()
  creatorId: string;

  @ApiProperty({ example: "새 회의 이름", description: "변경할 방 이름" })
  @IsString()
  @MinLength(1)
  name: string;
}

export class UpdateNicknameDto {
  @ApiProperty({ example: "user-uuid-1234", description: "유저 ID" })
  @IsString()
  userId: string;

  @ApiProperty({ example: "새 닉네임", description: "변경할 닉네임" })
  @IsString()
  @MinLength(1)
  name: string;

  @ApiProperty({ example: "https://example.com/thumb.png", required: false, description: "변경할 썸네일 URL" })
  @IsOptional()
  @IsString()
  thumbnail?: string;
}
