import { Injectable, NotFoundException, GoneException, ForbiddenException } from "@nestjs/common";
import { customAlphabet } from "nanoid";
import { PrismaService } from "../prisma/prisma.service";
import { CreateRoomDto } from "./dto/create-room.dto";
import { SubmitAvailabilityDto } from "./dto/submit-availability.dto";
import { DeleteRoomDto, UpdateRoomNameDto, UpdateNicknameDto } from "./dto/room-request.dto";
import {
  RoomDetailResponseDto,
  CreateRoomResponseDto,
  ExtendRoomResponseDto,
  UpdateRoomNameResponseDto,
  UpdateNicknameResponseDto,
} from "./dto/room-response.dto";

const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
const generateId = customAlphabet(ALPHABET, 8);

const INITIAL_EXPIRY_DAYS = 10;
const EXTEND_DAYS = 30;

@Injectable()
export class RoomsService {
  constructor(private readonly prisma: PrismaService) {}

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
    expiresAt.setDate(expiresAt.getDate() + INITIAL_EXPIRY_DAYS);

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
        name: room.name,
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

    const participant = await this.prisma.participant.upsert({
      where: { roomId_userId: { roomId, userId: dto.participantId } },
      create: { roomId, userId: dto.participantId, name: dto.participantName },
      update: { name: dto.participantName },
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
  }

  async extendRoom(roomId: string): Promise<ExtendRoomResponseDto> {
    const room = await this.prisma.room.findUnique({ where: { id: roomId } });
    if (!room) {
      throw new NotFoundException("방을 찾을 수 없습니다");
    }

    const baseDate = new Date() > room.expiresAt ? new Date() : room.expiresAt;
    const newExpiresAt = new Date(baseDate);
    newExpiresAt.setDate(newExpiresAt.getDate() + EXTEND_DAYS);

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

    await this.prisma.room.delete({ where: { id: roomId } });
  }

  async updateRoomName(roomId: string, dto: UpdateRoomNameDto): Promise<UpdateRoomNameResponseDto> {
    const room = await this.prisma.room.findUnique({ where: { id: roomId } });
    if (!room) {
      throw new NotFoundException("방을 찾을 수 없습니다");
    }
    if (room.creatorId !== dto.creatorId) {
      throw new ForbiddenException("방 생성자만 이름을 변경할 수 있습니다");
    }

    const updated = await this.prisma.room.update({
      where: { id: roomId },
      data: { name: dto.name },
    });

    return { name: updated.name };
  }

  async updateNickname(roomId: string, dto: UpdateNicknameDto): Promise<UpdateNicknameResponseDto> {
    const participant = await this.prisma.participant.findUnique({
      where: { roomId_userId: { roomId, userId: dto.userId } },
    });
    if (!participant) {
      throw new NotFoundException("해당 방에서 참여자를 찾을 수 없습니다");
    }

    const updated = await this.prisma.participant.update({
      where: { id: participant.id },
      data: { name: dto.name },
    });

    return { name: updated.name };
  }
}
