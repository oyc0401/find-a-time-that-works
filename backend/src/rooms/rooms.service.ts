import { Injectable, NotFoundException, GoneException, ForbiddenException } from "@nestjs/common";
import { customAlphabet } from "nanoid";
import { PrismaService } from "../prisma/prisma.service";
import { RoomsEventService } from "./rooms-event.service";
import { CreateRoomDto } from "./dto/create-room.dto";
import { SubmitAvailabilityDto } from "./dto/submit-availability.dto";
import { DeleteRoomDto, UpdateRoomNameDto, UpdateNicknameDto } from "./dto/room-request.dto";
import { RoomDetailResponseDto, CreateRoomResponseDto, ExtendRoomResponseDto } from "./dto/room-response.dto";

const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
const generateId = customAlphabet(ALPHABET, 8);

const INITIAL_EXPIRY_DAYS = 10;
const EXTEND_DAYS = 30;

@Injectable()
export class RoomsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly roomsEventService: RoomsEventService,
  ) {}

  private async generateUniqueId(): Promise<string> {
    for (let i = 0; i < 10; i++) {
      const id = generateId();
      const existing = await this.prisma.room.findUnique({ where: { id } });
      if (!existing) return id;
    }
    throw new Error("ID 생성 실패: 재시도 초과");
  }

  private assertNotExpired(expiresAt: Date): void {
    if (new Date() > expiresAt) {
      throw new GoneException("만료된 방입니다");
    }
  }

  async create(dto: CreateRoomDto): Promise<CreateRoomResponseDto> {
    const id = await this.generateUniqueId();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + INITIAL_EXPIRY_DAYS + 1);
    expiresAt.setHours(0, 0, 0, 0);

    const room = await this.prisma.room.create({
      data: {
        id,
        name: dto.name,
        creatorId: dto.creatorId,
        dates: dto.dates.map((d) => new Date(d)),
        startTime: dto.startTime,
        endTime: dto.endTime,
        expiresAt,
      },
    });

    await this.prisma.participant.create({
      data: {
        roomId: id,
        userId: dto.creatorId,
        name: dto.creatorName,
      },
    });

    return { id: room.id };
  }

  async findById(id: string): Promise<RoomDetailResponseDto> {
    const room = await this.prisma.room.findUnique({
      where: { id },
      include: {
        participants: {
          include: { availabilities: true },
        },
      },
    });

    if (!room) {
      throw new NotFoundException("방을 찾을 수 없습니다");
    }
    this.assertNotExpired(room.expiresAt);

    return {
      room: {
        id: room.id,
        name: room.name ?? undefined,
        creatorId: room.creatorId,
        dates: room.dates.map((d) => d.toISOString().split("T")[0]),
        startTime: room.startTime,
        endTime: room.endTime,
        createdAt: room.createdAt.toISOString(),
        expiresAt: room.expiresAt.toISOString(),
      },
      participants: room.participants.map((p) => ({
        id: p.id,
        userId: p.userId,
        name: p.name,
        thumbnail: p.thumbnail ?? undefined,
        slots: p.availabilities.map((a) => ({
          date: a.date.toISOString().split("T")[0],
          time: a.startTime,
        })),
      })),
    };
  }

  async submitAvailability(roomId: string, dto: SubmitAvailabilityDto): Promise<void> {
    const room = await this.prisma.room.findUnique({ where: { id: roomId } });
    if (!room) {
      throw new NotFoundException("방을 찾을 수 없습니다");
    }
    this.assertNotExpired(room.expiresAt);

    const updateData: { name: string; thumbnail?: string } = { name: dto.participantName };
    const createData: { roomId: string; userId: string; name: string; thumbnail?: string } = {
      roomId,
      userId: dto.participantId,
      name: dto.participantName,
    };
    if (dto.participantThumbnail !== undefined) {
      updateData.thumbnail = dto.participantThumbnail;
      createData.thumbnail = dto.participantThumbnail;
    }

    const participant = await this.prisma.participant.upsert({
      where: { roomId_userId: { roomId, userId: dto.participantId } },
      create: createData,
      update: updateData,
    });

    // 기존 가용 시간 삭제 후 새로 입력
    await this.prisma.availability.deleteMany({
      where: { participantId: participant.id },
    });

    if (dto.slots.length > 0) {
      await this.prisma.availability.createMany({
        data: dto.slots.map((slot) => ({
          participantId: participant.id,
          date: new Date(slot.date),
          startTime: slot.time,
        })),
      });
    }

    // 가용성 변경 이벤트 발행 (신호만)
    this.roomsEventService.emitRoomUpdated({
      roomId,
      triggeredBy: dto.participantId,
    });
  }

  async extendRoom(roomId: string): Promise<ExtendRoomResponseDto> {
    const room = await this.prisma.room.findUnique({ where: { id: roomId } });
    if (!room) {
      throw new NotFoundException("방을 찾을 수 없습니다");
    }

    const baseDate = new Date() > room.expiresAt ? new Date() : room.expiresAt;
    const newExpiresAt = new Date(baseDate);
    newExpiresAt.setDate(newExpiresAt.getDate() + EXTEND_DAYS + 1);
    newExpiresAt.setHours(0, 0, 0, 0);

    await this.prisma.room.update({
      where: { id: roomId },
      data: { expiresAt: newExpiresAt },
    });

    return { expiresAt: newExpiresAt.toISOString() };
  }

  async deleteRoom(roomId: string, dto: DeleteRoomDto): Promise<void> {
    const room = await this.prisma.room.findUnique({ where: { id: roomId } });
    if (!room) {
      throw new NotFoundException("방을 찾을 수 없습니다");
    }
    if (room.creatorId !== dto.creatorId) {
      throw new ForbiddenException("방 생성자만 삭제할 수 있습니다");
    }

    // 삭제 전 이벤트 발행 (삭제 후에는 방이 없음)
    this.roomsEventService.emitRoomDeleted({
      roomId,
      triggeredBy: dto.creatorId,
    });

    await this.prisma.room.delete({ where: { id: roomId } });
  }

  async updateRoomName(roomId: string, dto: UpdateRoomNameDto): Promise<void> {
    const room = await this.prisma.room.findUnique({ where: { id: roomId } });
    if (!room) {
      throw new NotFoundException("방을 찾을 수 없습니다");
    }
    if (room.creatorId !== dto.creatorId) {
      throw new ForbiddenException("방 생성자만 이름을 변경할 수 있습니다");
    }

    await this.prisma.room.update({
      where: { id: roomId },
      data: { name: dto.name },
    });

    // 방 이름 변경 이벤트 발행 (데이터 포함)
    this.roomsEventService.emitRoomNameUpdated({
      roomId,
      triggeredBy: dto.creatorId,
      name: dto.name,
    });
  }

  async updateNickname(roomId: string, dto: UpdateNicknameDto): Promise<void> {
    const participant = await this.prisma.participant.findUnique({
      where: { roomId_userId: { roomId, userId: dto.userId } },
    });
    if (!participant) {
      throw new NotFoundException("해당 방에서 참여자를 찾을 수 없습니다");
    }

    const data: { name: string; thumbnail?: string } = { name: dto.name };
    if (dto.thumbnail !== undefined) {
      data.thumbnail = dto.thumbnail;
    }

    await this.prisma.participant.update({
      where: { id: participant.id },
      data,
    });

    // 프로필 변경 이벤트 발행 (데이터 포함)
    this.roomsEventService.emitProfileUpdated({
      roomId,
      triggeredBy: dto.userId,
      userId: dto.userId,
      name: dto.name,
      thumbnail: dto.thumbnail,
    });
  }
}
