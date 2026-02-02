import { Injectable } from "@nestjs/common";
import { Server } from "socket.io";
import {
  WsEventType,
  RoomUpdatedPayloadDto,
  RoomNameUpdatedPayloadDto,
  ProfileUpdatedPayloadDto,
  RoomDeletedPayloadDto,
} from "./dto/ws-events.dto";

@Injectable()
export class RoomsEventService {
  private server?: Server;

  setServer(server: Server): void {
    this.server = server;
  }

  private emitToRoom<T>(roomId: string, event: WsEventType, payload: T): void {
    if (!this.server) return;
    this.server.to(`room:${roomId}`).emit(event, payload);
  }

  // 가용성 변경 (신호만)
  emitRoomUpdated(payload: RoomUpdatedPayloadDto): void {
    this.emitToRoom(payload.roomId, WsEventType.ROOM_UPDATED, payload);
  }

  // 방 이름 변경 (데이터 포함)
  emitRoomNameUpdated(payload: RoomNameUpdatedPayloadDto): void {
    this.emitToRoom(payload.roomId, WsEventType.ROOM_NAME_UPDATED, payload);
  }

  // 프로필 변경 (데이터 포함)
  emitProfileUpdated(payload: ProfileUpdatedPayloadDto): void {
    this.emitToRoom(payload.roomId, WsEventType.PROFILE_UPDATED, payload);
  }

  // 방 삭제 (신호만)
  emitRoomDeleted(payload: RoomDeletedPayloadDto): void {
    this.emitToRoom(payload.roomId, WsEventType.ROOM_DELETED, payload);
  }
}
