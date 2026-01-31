import { Controller, Get, Post, Param, Body, Query } from "@nestjs/common";
import { ApiTags, ApiOperation, ApiParam, ApiResponse, ApiQuery } from "@nestjs/swagger";
import { RoomsService } from "./rooms.service";
import { CreateRoomDto } from "./dto/create-room.dto";
import { SubmitAvailabilityDto } from "./dto/submit-availability.dto";
import {
  CreateRoomResponseDto,
  RoomDetailResponseDto,
  SubmitAvailabilityResponseDto,
  OverlapResponseDto,
  ExtendRoomResponseDto,
} from "./dto/room-response.dto";

@ApiTags("rooms")
@Controller("rooms")
export class RoomsController {
  constructor(private readonly roomsService: RoomsService) {}

  @Post()
  @ApiOperation({ summary: "방 생성" })
  @ApiResponse({ status: 201, type: CreateRoomResponseDto })
  async create(@Body() dto: CreateRoomDto): Promise<CreateRoomResponseDto> {
    return this.roomsService.create(dto);
  }

  @Get(":id")
  @ApiOperation({ summary: "방 상세 조회" })
  @ApiParam({ name: "id", description: "방 ID (8자)", example: "aB3kZ9xQ" })
  @ApiResponse({ status: 200, type: RoomDetailResponseDto })
  @ApiResponse({ status: 404, description: "방을 찾을 수 없습니다" })
  @ApiResponse({ status: 410, description: "만료된 방입니다" })
  async findById(@Param("id") id: string): Promise<RoomDetailResponseDto> {
    return this.roomsService.findById(id);
  }

  @Post(":id/availability")
  @ApiOperation({ summary: "가용 시간 입력 (같은 사용자 UUID면 덮어쓰기)" })
  @ApiParam({ name: "id", description: "방 ID (8자)", example: "aB3kZ9xQ" })
  @ApiResponse({ status: 201, type: SubmitAvailabilityResponseDto })
  @ApiResponse({ status: 404, description: "방을 찾을 수 없습니다" })
  @ApiResponse({ status: 410, description: "만료된 방입니다" })
  async submitAvailability(
    @Param("id") roomId: string,
    @Body() dto: SubmitAvailabilityDto,
  ): Promise<SubmitAvailabilityResponseDto> {
    return this.roomsService.submitAvailability(roomId, dto);
  }

  @Get(":id/overlap")
  @ApiOperation({ summary: "겹치는 시간 조회" })
  @ApiParam({ name: "id", description: "방 ID (8자)", example: "aB3kZ9xQ" })
  @ApiQuery({ name: "participantId", required: false, description: "특정 참여자 슬롯 기준으로 필터링" })
  @ApiResponse({ status: 200, type: OverlapResponseDto })
  @ApiResponse({ status: 404, description: "방을 찾을 수 없습니다" })
  @ApiResponse({ status: 410, description: "만료된 방입니다" })
  async getOverlap(
    @Param("id") roomId: string,
    @Query("participantId") participantId?: string,
  ): Promise<OverlapResponseDto> {
    return this.roomsService.getOverlap(roomId, participantId);
  }

  @Post(":id/extend")
  @ApiOperation({ summary: "방 만료 기간 30일 연장" })
  @ApiParam({ name: "id", description: "방 ID (8자)", example: "aB3kZ9xQ" })
  @ApiResponse({ status: 201, type: ExtendRoomResponseDto })
  @ApiResponse({ status: 404, description: "방을 찾을 수 없습니다" })
  async extendRoom(@Param("id") roomId: string): Promise<ExtendRoomResponseDto> {
    return this.roomsService.extendRoom(roomId);
  }
}
