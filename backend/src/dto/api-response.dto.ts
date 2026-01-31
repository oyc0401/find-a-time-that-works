import { ApiProperty } from "@nestjs/swagger";

export class PaginatedMeta {
  @ApiProperty({ example: 100, description: "전체 항목 수" })
  total: number;

  @ApiProperty({ example: 1, description: "현재 페이지" })
  page: number;

  @ApiProperty({ example: 20, description: "페이지당 항목 수" })
  limit: number;

  @ApiProperty({ example: true, description: "다음 페이지 존재 여부" })
  hasMore: boolean;
}
