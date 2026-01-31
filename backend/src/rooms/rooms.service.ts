import { Injectable, NotFoundException, GoneException } from "@nestjs/common";
import { customAlphabet } from "nanoid";
import { PrismaService } from "../prisma/prisma.service";
import { CreateRoomDto } from "./dto/create-room.dto";
import { SubmitAvailabilityDto } from "./dto/submit-availability.dto";
import { OverlapSlotDto } from "../dto";
import {
  RoomDetailResponseDto,
  CreateRoomResponseDto,
  SubmitAvailabilityResponseDto,
  OverlapResponseDto,
  ExtendRoomResponseDto,
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

  async submitAvailability(
    roomId: string,
    dto: SubmitAvailabilityDto,
  ): Promise<SubmitAvailabilityResponseDto> {
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

    return { participantId: participant.id };
  }

  async getOverlap(roomId: string, participantId?: string): Promise<OverlapResponseDto> {
    const room = await this.prisma.room.findUnique({
      where: { id: roomId },
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

    // participantId가 지정되면 해당 참여자의 슬롯만 기준으로 필터링
    const targetSlotKeys = new Set<string>();
    if (participantId) {
      const target = room.participants.find((p) => p.id === participantId);
      if (!target) {
        throw new NotFoundException("참여자를 찾을 수 없습니다");
      }
      for (const a of target.availabilities) {
        targetSlotKeys.add(`${a.date.toISOString().split("T")[0]}_${a.startTime}`);
      }
    }

    // 슬롯별 참여자 집계
    const slotMap = new Map<string, string[]>();

    for (const participant of room.participants) {
      for (const availability of participant.availabilities) {
        const key = `${availability.date.toISOString().split("T")[0]}_${availability.startTime}`;
        if (participantId && !targetSlotKeys.has(key)) continue;
        const names = slotMap.get(key) ?? [];
        names.push(participant.name);
        slotMap.set(key, names);
      }
    }

    const slots: OverlapSlotDto[] = Array.from(slotMap.entries())
      .map(([key, participants]) => {
        const [date, time] = key.split("_");
        return { date, time, count: participants.length, participants };
      })
      .sort((a, b) => a.date.localeCompare(b.date) || a.time.localeCompare(b.time));

    return {
      totalParticipants: room.participants.length,
      slots,
    };
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
}
