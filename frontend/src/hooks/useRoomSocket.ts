import { useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import type { Socket } from "socket.io-client";
import { getRoomsControllerFindByIdQueryKey } from "@/api/model/rooms/rooms";
import { getSocket, disconnectSocket } from "@/lib/socket";
import { getUserId } from "@/lib/userId";
import {
  WsEventType,
  type RoomUpdatedPayload,
  type RoomNameUpdatedPayload,
  type ProfileUpdatedPayload,
  type RoomDeletedPayload,
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
  const roomIdRef = useRef<string>(roomId);
  const socketRef = useRef<Socket | undefined>(undefined);

  // roomId 변경 추적
  useEffect(() => {
    roomIdRef.current = roomId;
  }, [roomId]);

  // 데이터 refetch 함수
  const refetchRoom = useCallback(() => {
    if (!roomIdRef.current) return;
    queryClient.invalidateQueries({
      queryKey: getRoomsControllerFindByIdQueryKey(roomIdRef.current),
    });
  }, [queryClient]);

  useEffect(() => {
    if (!enabled || !roomId) return;

    let mounted = true;

    // 이벤트 핸들러들
    const handleRoomUpdated = (payload: RoomUpdatedPayload): void => {
      if (payload.triggeredBy === userIdRef.current) return;
      refetchRoom();
    };

    const handleRoomNameUpdated = (payload: RoomNameUpdatedPayload): void => {
      if (payload.triggeredBy === userIdRef.current) return;
      refetchRoom();
    };

    const handleProfileUpdated = (payload: ProfileUpdatedPayload): void => {
      if (payload.triggeredBy === userIdRef.current) return;
      refetchRoom();
    };

    const handleRoomDeleted = (payload: RoomDeletedPayload): void => {
      if (payload.triggeredBy === userIdRef.current) return;
      navigate("/", { replace: true });
    };

    // 재연결 시 room rejoin
    const handleConnect = (): void => {
      if (!mounted || !socketRef.current) return;
      socketRef.current.emit(WsEventType.JOIN_ROOM, {
        roomId: roomIdRef.current,
      });
    };

    // visibilitychange 핸들러 (포그라운드 복귀 시 refetch)
    const handleVisibilityChange = (): void => {
      if (document.visibilityState === "visible" && mounted) {
        refetchRoom();
      }
    };

    // 소켓 초기화 및 연결
    const initSocket = async () => {
      const [socket, userId] = await Promise.all([getSocket(), getUserId()]);

      if (!mounted) return;

      socketRef.current = socket;
      userIdRef.current = userId;

      // 이벤트 리스너 등록
      socket.on("connect", handleConnect);
      socket.on(WsEventType.ROOM_UPDATED, handleRoomUpdated);
      socket.on(WsEventType.ROOM_NAME_UPDATED, handleRoomNameUpdated);
      socket.on(WsEventType.PROFILE_UPDATED, handleProfileUpdated);
      socket.on(WsEventType.ROOM_DELETED, handleRoomDeleted);

      // 소켓 연결
      socket.connect();
      socket.emit(WsEventType.JOIN_ROOM, { roomId });
    };

    initSocket();

    // visibilitychange 리스너 등록
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      mounted = false;
      document.removeEventListener("visibilitychange", handleVisibilityChange);

      const socket = socketRef.current;
      if (socket) {
        socket.emit(WsEventType.LEAVE_ROOM, { roomId });
        socket.off("connect", handleConnect);
        socket.off(WsEventType.ROOM_UPDATED, handleRoomUpdated);
        socket.off(WsEventType.ROOM_NAME_UPDATED, handleRoomNameUpdated);
        socket.off(WsEventType.PROFILE_UPDATED, handleProfileUpdated);
        socket.off(WsEventType.ROOM_DELETED, handleRoomDeleted);
        disconnectSocket();
      }
    };
  }, [roomId, enabled, queryClient, navigate, refetchRoom]);
}
