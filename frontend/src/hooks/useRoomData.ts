import { useRoomsControllerFindById } from "@/api/model/rooms/rooms";

export function useRoomData(roomId?: string) {
  return useRoomsControllerFindById(roomId ?? "", {
    query: {
      enabled: Boolean(roomId),
    },
  });
}
