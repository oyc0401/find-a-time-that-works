export enum WsEventType {
  JOIN_ROOM = "joinRoom",
  LEAVE_ROOM = "leaveRoom",
  ROOM_UPDATED = "roomUpdated",
  ROOM_NAME_UPDATED = "roomNameUpdated",
  PROFILE_UPDATED = "profileUpdated",
  ROOM_DELETED = "roomDeleted",
}

export interface RoomUpdatedPayload {
  roomId: string;
  triggeredBy: string;
}

export interface RoomNameUpdatedPayload {
  roomId: string;
  triggeredBy: string;
  name: string;
}

export interface ProfileUpdatedPayload {
  roomId: string;
  triggeredBy: string;
  userId: string;
  name: string;
  thumbnail?: string;
}

export interface RoomDeletedPayload {
  roomId: string;
  triggeredBy: string;
}
