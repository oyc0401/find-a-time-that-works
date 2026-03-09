import { useMemo } from "react";
import { useRoomsControllerFindById } from "@/api/model/rooms/rooms";

export function useRoomData(roomId?: string) {
  const query = useRoomsControllerFindById(roomId ?? "", {
    query: {
      enabled: Boolean(roomId),
    },
  });

  const responseData =
    query.data?.status === 200 ? query.data.data.data : undefined;

  const room = responseData?.room;
  const participants = responseData?.participants ?? [];
  const columns = useMemo(
    () => (room?.dates ?? []).map((date, idx) => ({ date, storeColIdx: idx })),
    [room?.dates],
  );

  return { room, participants, columns, isLoading: query.isLoading };
}
