import { useCallback, useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  getRoomsControllerFindByIdQueryKey,
  useRoomsControllerSubmitAvailability,
  type RoomsControllerFindByIdQueryResult,
} from "@/api/model/rooms/rooms";
import type { AvailabilitySlotDto } from "@/api/model/models";
import { getUserId } from "@/lib/userId";
import { generateTimeSlots } from "@/lib/timeSlots";
import { useAvailabilityStore } from "@/stores/useAvailabilityStore";
import { useRoomStore } from "@/stores/useRoomStore";

function gridToSlots(
  grid: boolean[][],
  dates: string[],
  timeSlots: string[],
): AvailabilitySlotDto[] {
  const slots: AvailabilitySlotDto[] = [];
  for (let r = 0; r < timeSlots.length; r++) {
    for (let c = 0; c < dates.length; c++) {
      if (grid[r]?.[c]) {
        slots.push({ date: dates[c], time: timeSlots[r] });
      }
    }
  }
  return slots;
}

export function useSubmitAvailability(roomId?: string) {
  const queryClient = useQueryClient();
  const { mutate } = useRoomsControllerSubmitAvailability();
  const enabledRef = useRef(false);

  const enable = useCallback(() => {
    enabledRef.current = true;
  }, []);

  const submitCurrent = useCallback(
    (roomId: string) => {
      const queryKey = getRoomsControllerFindByIdQueryKey(roomId);
      const cached =
        queryClient.getQueryData<RoomsControllerFindByIdQueryResult>(queryKey);
      if (!cached || cached.status !== 200) return;

      const room = cached.data.data.room;
      const timeSlots = generateTimeSlots(room.startTime, room.endTime);
      const grid = useAvailabilityStore.getState().grid;
      const slots = gridToSlots(grid, room.dates, timeSlots);

      getUserId().then((userId) => {
        const nickname = useRoomStore.getState().nickname;
        mutate(
          {
            id: room.id,
            data: { participantId: userId, participantName: nickname, slots },
          },
          {
            onSuccess: () => {
              queryClient.invalidateQueries({
                queryKey: getRoomsControllerFindByIdQueryKey(roomId),
              });
            },
          },
        );
      });
    },
    [mutate, queryClient],
  );

  useEffect(() => {
    if (!roomId) return;

    const unsub = useAvailabilityStore.subscribe((state, prev) => {
      if (state.grid === prev.grid) return;
      if (!enabledRef.current) return;
      submitCurrent(roomId);
    });

    return unsub;
  }, [roomId, submitCurrent]);

  useEffect(() => {
    if (!roomId) return;

    const unsub = useRoomStore.subscribe((state, prev) => {
      if (state.nickname === prev.nickname) return;
      if (!enabledRef.current) return;
      submitCurrent(roomId);
    });

    return unsub;
  }, [roomId, submitCurrent]);

  return { enable };
}
