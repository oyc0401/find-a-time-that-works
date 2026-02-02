import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayInit,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from "@nestjs/websockets";
import { Server, Socket } from "socket.io";
import { RoomsEventService } from "./rooms-event.service";
import { WsEventType, JoinRoomDto, LeaveRoomDto } from "./dto/ws-events.dto";

interface WsResponse {
  success: boolean;
  roomId: string;
}

@WebSocketGateway({
  cors: { origin: true, credentials: true },
  namespace: "/rooms",
})
export class RoomsGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer() server: Server;

  constructor(private readonly roomsEventService: RoomsEventService) {}

  afterInit(server: Server): void {
    this.roomsEventService.setServer(server);
  }

  handleConnection(_client: Socket): void {
    // 연결 시 특별한 처리 없음
  }

  handleDisconnect(_client: Socket): void {
    // 연결 해제 시 특별한 처리 없음 (Socket.IO가 자동으로 room에서 제거)
  }

  @SubscribeMessage(WsEventType.JOIN_ROOM)
  async handleJoinRoom(client: Socket, data: JoinRoomDto): Promise<WsResponse> {
    await client.join(`room:${data.roomId}`);
    return { success: true, roomId: data.roomId };
  }

  @SubscribeMessage(WsEventType.LEAVE_ROOM)
  async handleLeaveRoom(client: Socket, data: LeaveRoomDto): Promise<WsResponse> {
    await client.leave(`room:${data.roomId}`);
    return { success: true, roomId: data.roomId };
  }
}
