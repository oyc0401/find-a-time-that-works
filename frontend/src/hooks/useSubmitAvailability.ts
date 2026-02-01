import { useCallback, useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  getRoomsControllerFindByIdQueryKey,
  useRoomsControllerSubmitAvailability,
} from "@/api/model/rooms/rooms";
import type { AvailabilitySlotDto } from "@/api/model/models";
import { getUserId } from "@/lib/userId";
import { useRoomStore } from "@/stores/useRoomStore";
import { generateTimeSlots } from "@/lib/timeSlots";
import { useAvailabilityStore } from "@/stores/useAvailabilityStore";

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

export function useSubmitAvailability() {
  const queryClient = useQueryClient();
  const { mutate } = useRoomsControllerSubmitAvailability();
  const userIdRef = useRef<string>();
  const enabledRef = useRef(false);

  // 초기 로드(init + loadFromSlots) 완료 후 호출하여 전송 활성화
  const enable = useCallback(() => {
    enabledRef.current = true;
  }, []);

  useEffect(() => {
    const unsub = useAvailabilityStore.subscribe((state, prev) => {
      if (state.grid === prev.grid) return;
      if (!enabledRef.current) return;

      const room = useRoomStore.getState().room;
      if (!room) return;

      const timeSlots = generateTimeSlots(room.startTime, room.endTime);
      const slots = gridToSlots(state.grid, room.dates, timeSlots);

      const doSubmit = (participantId: string) => {
        mutate(
          {
            id: room.id,
            data: { participantId, participantName: "익명", slots },
          },
          {
            onSuccess: () => {
              queryClient.invalidateQueries({
                queryKey: getRoomsControllerFindByIdQueryKey(room.id),
              });
            },
          },
        );
      };

      if (userIdRef.current) {
        doSubmit(userIdRef.current);
      } else {
        getUserId().then((id) => {
          userIdRef.current = id;
          doSubmit(id);
        });
      }
    });

    return unsub;
  }, [mutate, queryClient]);

  return { enable };
}
