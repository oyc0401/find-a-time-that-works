import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { getRoomsControllerFindByIdQueryKey } from "@/api/model/rooms/rooms";
import { getSocket } from "@/lib/socket";
import { getUserId } from "@/lib/userId";
import {
  WsEventType,
  RoomUpdatedPayload,
  RoomNameUpdatedPayload,
  ProfileUpdatedPayload,
  RoomDeletedPayload,
} from "@/types/socket";

interface UseRoomSocketOptions {
  roomId: string;
  enabled?: boolean;
}

export function useRoomSocket({
  roomId,
  enabled = true,
}: UseRoomSocketOptions): void {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const userIdRef = useRef<string>("");

  useEffect(() => {
    if (!enabled || !roomId) return;

    const socket = getSocket();
    let mounted = true;

    getUserId().then((userId) => {
      if (!mounted) return;
      userIdRef.current = userId;
    });

    socket.connect();
    socket.emit(WsEventType.JOIN_ROOM, { roomId });

    const handleRoomUpdated = (payload: RoomUpdatedPayload): void => {
      if (payload.triggeredBy === userIdRef.current) return;
      queryClient.invalidateQueries({
        queryKey: getRoomsControllerFindByIdQueryKey(roomId),
      });
    };

    const handleRoomNameUpdated = (payload: RoomNameUpdatedPayload): void => {
      if (payload.triggeredBy === userIdRef.current) return;
      queryClient.invalidateQueries({
        queryKey: getRoomsControllerFindByIdQueryKey(roomId),
      });
    };

    const handleProfileUpdated = (payload: ProfileUpdatedPayload): void => {
      if (payload.triggeredBy === userIdRef.current) return;
      queryClient.invalidateQueries({
        queryKey: getRoomsControllerFindByIdQueryKey(roomId),
      });
    };

    const handleRoomDeleted = (payload: RoomDeletedPayload): void => {
      if (payload.triggeredBy === userIdRef.current) return;
      navigate("/", { replace: true });
    };

    socket.on(WsEventType.ROOM_UPDATED, handleRoomUpdated);
    socket.on(WsEventType.ROOM_NAME_UPDATED, handleRoomNameUpdated);
    socket.on(WsEventType.PROFILE_UPDATED, handleProfileUpdated);
    socket.on(WsEventType.ROOM_DELETED, handleRoomDeleted);

    return () => {
      mounted = false;
      socket.emit(WsEventType.LEAVE_ROOM, { roomId });
      socket.off(WsEventType.ROOM_UPDATED, handleRoomUpdated);
      socket.off(WsEventType.ROOM_NAME_UPDATED, handleRoomNameUpdated);
      socket.off(WsEventType.PROFILE_UPDATED, handleProfileUpdated);
      socket.off(WsEventType.ROOM_DELETED, handleRoomDeleted);
      socket.disconnect();
    };
  }, [roomId, enabled, queryClient, navigate]);
}
