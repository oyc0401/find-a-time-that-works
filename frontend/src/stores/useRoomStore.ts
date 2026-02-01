import { create } from "zustand";
import type { WeekGroup } from "@/lib/weekGroup";
import type { ParticipantDto, RoomDto } from "@/api/model/models";
import { groupDatesByWeek } from "@/lib/weekGroup";

interface RoomState {
  room?: RoomDto;
  participants: ParticipantDto[];
  weeks: WeekGroup[];
  weekIdx: number;
  setRoom: (room: RoomDto, participants: ParticipantDto[]) => void;
  setWeekIdx: (idx: number) => void;
  reset: () => void;
}

export const useRoomStore = create<RoomState>((set) => ({
  room: undefined,
  participants: [],
  weeks: [],
  weekIdx: 0,
  setRoom: (room, participants) =>
    set({
      room,
      participants,
      weeks: groupDatesByWeek(room.dates),
      weekIdx: 0,
    }),
  setWeekIdx: (idx) => set({ weekIdx: idx }),
  reset: () =>
    set({ room: undefined, participants: [], weeks: [], weekIdx: 0 }),
}));
