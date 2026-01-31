import { Controller, Get, Post, Patch, Delete, Param, Body, HttpCode } from "@nestjs/common";
import { ApiTags, ApiOperation, ApiParam, ApiResponse as SwaggerApiResponse } from "@nestjs/swagger";
import { RoomsService } from "./rooms.service";
import { CreateRoomDto } from "./dto/create-room.dto";
import { SubmitAvailabilityDto } from "./dto/submit-availability.dto";
import { DeleteRoomDto, UpdateRoomNameDto, UpdateNicknameDto } from "./dto/room-request.dto";
import {
  CreateRoomApiResponseDto,
  RoomDetailApiResponseDto,
  SubmitAvailabilityApiResponseDto,
  ExtendRoomApiResponseDto,
  DeleteRoomApiResponseDto,
  UpdateRoomNameApiResponseDto,
  UpdateNicknameApiResponseDto,
} from "./dto/room-response.dto";

@ApiTags("rooms")
@Controller("rooms")
export class RoomsController {
  constructor(private readonly roomsService: RoomsService) {}

  @Post()
  @ApiOperation({ summary: "방 생성" })
  @SwaggerApiResponse({ status: 201, type: CreateRoomApiResponseDto })
  async create(@Body() dto: CreateRoomDto): Promise<CreateRoomApiResponseDto> {
    const data = await this.roomsService.create(dto);
    return { data, message: "방이 생성되었습니다" };
  }

  @Get(":id")
  @ApiOperation({ summary: "방 상세 조회" })
  @ApiParam({ name: "id", description: "방 ID (8자)", example: "aB3kZ9xQ" })
  @SwaggerApiResponse({ status: 200, type: RoomDetailApiResponseDto })
  @SwaggerApiResponse({ status: 404, description: "방을 찾을 수 없습니다" })
  @SwaggerApiResponse({ status: 410, description: "만료된 방입니다" })
  async findById(@Param("id") id: string): Promise<RoomDetailApiResponseDto> {
    const data = await this.roomsService.findById(id);
    return { data, message: "조회 성공" };
  }

  @Post(":id/availability")
  @ApiOperation({ summary: "가용 시간 입력" })
  @ApiParam({ name: "id", description: "방 ID (8자)", example: "aB3kZ9xQ" })
  @SwaggerApiResponse({ status: 201, type: SubmitAvailabilityApiResponseDto })
  @SwaggerApiResponse({ status: 404, description: "방을 찾을 수 없습니다" })
  @SwaggerApiResponse({ status: 410, description: "만료된 방입니다" })
  async submitAvailability(
    @Param("id") roomId: string,
    @Body() dto: SubmitAvailabilityDto,
  ): Promise<SubmitAvailabilityApiResponseDto> {
    await this.roomsService.submitAvailability(roomId, dto);
    return { data: null, message: "가용 시간이 저장되었습니다" };
  }

  @Post(":id/extend")
  @ApiOperation({ summary: "방 만료 기간 30일 연장" })
  @ApiParam({ name: "id", description: "방 ID (8자)", example: "aB3kZ9xQ" })
  @SwaggerApiResponse({ status: 201, type: ExtendRoomApiResponseDto })
  @SwaggerApiResponse({ status: 404, description: "방을 찾을 수 없습니다" })
  async extendRoom(@Param("id") roomId: string): Promise<ExtendRoomApiResponseDto> {
    const data = await this.roomsService.extendRoom(roomId);
    return { data, message: "만료 기간이 연장되었습니다" };
  }

  @Delete(":id")
  @HttpCode(200)
  @ApiOperation({ summary: "방 삭제" })
  @ApiParam({ name: "id", description: "방 ID (8자)", example: "aB3kZ9xQ" })
  @SwaggerApiResponse({ status: 200, type: DeleteRoomApiResponseDto })
  @SwaggerApiResponse({ status: 403, description: "방 생성자만 삭제할 수 있습니다" })
  @SwaggerApiResponse({ status: 404, description: "방을 찾을 수 없습니다" })
  async deleteRoom(@Param("id") roomId: string, @Body() dto: DeleteRoomDto): Promise<DeleteRoomApiResponseDto> {
    await this.roomsService.deleteRoom(roomId, dto);
    return { data: null, message: "방이 삭제되었습니다" };
  }

  @Patch(":id")
  @ApiOperation({ summary: "방 이름 변경" })
  @ApiParam({ name: "id", description: "방 ID (8자)", example: "aB3kZ9xQ" })
  @SwaggerApiResponse({ status: 200, type: UpdateRoomNameApiResponseDto })
  @SwaggerApiResponse({ status: 403, description: "방 생성자만 이름을 변경할 수 있습니다" })
  @SwaggerApiResponse({ status: 404, description: "방을 찾을 수 없습니다" })
  async updateRoomName(@Param("id") roomId: string, @Body() dto: UpdateRoomNameDto): Promise<UpdateRoomNameApiResponseDto> {
    const data = await this.roomsService.updateRoomName(roomId, dto);
    return { data, message: "방 이름이 변경되었습니다" };
  }

  @Patch(":id/nickname")
  @ApiOperation({ summary: "유저 닉네임 변경" })
  @ApiParam({ name: "id", description: "방 ID (8자)", example: "aB3kZ9xQ" })
  @SwaggerApiResponse({ status: 200, type: UpdateNicknameApiResponseDto })
  @SwaggerApiResponse({ status: 404, description: "해당 방에서 참여자를 찾을 수 없습니다" })
  async updateNickname(@Param("id") roomId: string, @Body() dto: UpdateNicknameDto): Promise<UpdateNicknameApiResponseDto> {
    const data = await this.roomsService.updateNickname(roomId, dto);
    return { data, message: "닉네임이 변경되었습니다" };
  }
}
