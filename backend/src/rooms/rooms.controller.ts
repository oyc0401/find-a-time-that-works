import { Controller, Get, Post, Patch, Delete, Param, Body, HttpCode } from "@nestjs/common";
import { ApiTags, ApiOperation, ApiParam, ApiResponse } from "@nestjs/swagger";
import { RoomsService } from "./rooms.service";
import { CreateRoomDto } from "./dto/create-room.dto";
import { SubmitAvailabilityDto } from "./dto/submit-availability.dto";
import { DeleteRoomDto, UpdateRoomNameDto, UpdateNicknameDto } from "./dto/room-request.dto";
import {
  CreateRoomResponseDto,
  RoomDetailResponseDto,
  SubmitAvailabilityResponseDto,
  ExtendRoomResponseDto,
  UpdateRoomNameResponseDto,
  UpdateNicknameResponseDto,
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

  @Post(":id/extend")
  @ApiOperation({ summary: "방 만료 기간 30일 연장" })
  @ApiParam({ name: "id", description: "방 ID (8자)", example: "aB3kZ9xQ" })
  @ApiResponse({ status: 201, type: ExtendRoomResponseDto })
  @ApiResponse({ status: 404, description: "방을 찾을 수 없습니다" })
  async extendRoom(@Param("id") roomId: string): Promise<ExtendRoomResponseDto> {
    return this.roomsService.extendRoom(roomId);
  }

  @Delete(":id")
  @HttpCode(204)
  @ApiOperation({ summary: "방 삭제 (생성자만)" })
  @ApiParam({ name: "id", description: "방 ID (8자)", example: "aB3kZ9xQ" })
  @ApiResponse({ status: 204, description: "삭제 완료" })
  @ApiResponse({ status: 403, description: "방 생성자만 삭제할 수 있습니다" })
  @ApiResponse({ status: 404, description: "방을 찾을 수 없습니다" })
  async deleteRoom(@Param("id") roomId: string, @Body() dto: DeleteRoomDto): Promise<void> {
    return this.roomsService.deleteRoom(roomId, dto);
  }

  @Patch(":id")
  @ApiOperation({ summary: "방 이름 변경 (생성자만)" })
  @ApiParam({ name: "id", description: "방 ID (8자)", example: "aB3kZ9xQ" })
  @ApiResponse({ status: 200, type: UpdateRoomNameResponseDto })
  @ApiResponse({ status: 403, description: "방 생성자만 이름을 변경할 수 있습니다" })
  @ApiResponse({ status: 404, description: "방을 찾을 수 없습니다" })
  async updateRoomName(@Param("id") roomId: string, @Body() dto: UpdateRoomNameDto): Promise<UpdateRoomNameResponseDto> {
    return this.roomsService.updateRoomName(roomId, dto);
  }

  @Patch(":id/nickname")
  @ApiOperation({ summary: "특정 방에서 유저 닉네임 변경" })
  @ApiParam({ name: "id", description: "방 ID (8자)", example: "aB3kZ9xQ" })
  @ApiResponse({ status: 200, type: UpdateNicknameResponseDto })
  @ApiResponse({ status: 404, description: "해당 방에서 참여자를 찾을 수 없습니다" })
  async updateNickname(@Param("id") roomId: string, @Body() dto: UpdateNicknameDto): Promise<UpdateNicknameResponseDto> {
    return this.roomsService.updateNickname(roomId, dto);
  }
}
