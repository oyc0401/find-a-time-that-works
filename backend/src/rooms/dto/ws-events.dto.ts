export enum WsEventType {
  // 클라이언트 -> 서버
  JOIN_ROOM = "joinRoom",
  LEAVE_ROOM = "leaveRoom",
  // 서버 -> 클라이언트
  ROOM_UPDATED = "roomUpdated",
  ROOM_NAME_UPDATED = "roomNameUpdated",
  PROFILE_UPDATED = "profileUpdated",
  ROOM_DELETED = "roomDeleted",
}

// 클라이언트 -> 서버
export class JoinRoomDto {
  roomId: string;
}

export class LeaveRoomDto {
  roomId: string;
}

// 서버 -> 클라이언트 (모든 이벤트에 triggeredBy 포함)

// 가용성 변경 (신호만 - 프론트에서 API 호출)
export class RoomUpdatedPayloadDto {
  roomId: string;
  triggeredBy: string;
}

// 방 이름 변경 (데이터 포함)
export class RoomNameUpdatedPayloadDto {
  roomId: string;
  triggeredBy: string;
  name: string;
}

// 프로필 변경 (데이터 포함)
export class ProfileUpdatedPayloadDto {
  roomId: string;
  triggeredBy: string;
  userId: string;
  name: string;
  thumbnail?: string;
}

// 방 삭제 (신호만)
export class RoomDeletedPayloadDto {
  roomId: string;
  triggeredBy: string;
}
