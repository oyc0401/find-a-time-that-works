import { useMemo } from "react";
import { useRoomsControllerFindById } from "@/api/model/rooms/rooms";
import { groupDatesByWeek } from "@/lib/weekGroup";

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
  const weeks = useMemo(
    () => (room ? groupDatesByWeek(room.dates) : []),
    [room],
  );

  return { room, participants, weeks, isLoading: query.isLoading };
}
