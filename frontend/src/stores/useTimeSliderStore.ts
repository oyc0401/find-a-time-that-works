import { create } from "zustand";

interface TimeSliderState {
  startHour: number;
  endHour: number;
  setStartHour: (hour: number) => void;
  setEndHour: (hour: number) => void;
}

export const useTimeSliderStore = create<TimeSliderState>((set) => ({
  startHour: 8,
  endHour:22,
  setStartHour: (hour) => set({ startHour: hour }),
  setEndHour: (hour) => set({ endHour: hour }),
}));
