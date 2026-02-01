import { useMemo, useState } from "react";
import { adaptive } from "@toss/tds-colors";
import { BottomSheet } from "@toss/tds-mobile";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { formatDateHeader } from "@/lib/timeSlots";
import { useRoomStore } from "@/stores/useRoomStore";
import CalendarView from "./CalendarView";

export default function WeekNavigation() {
  const { room, weeks, weekIdx, setWeekIdx } = useRoomStore();
  const [isOpen, setIsOpen] = useState(false);

  const highlightedDates = useMemo(
    () => new Set(room?.dates ?? []),
    [room?.dates],
  );

  if (weeks.length <= 1) return null;

  const currentWeek = weeks[weekIdx];
  if (!currentWeek) return null;

  const firstDate = currentWeek.columns[0].date;
  const lastDate = currentWeek.columns[currentWeek.columns.length - 1].date;
  const firstHeader = formatDateHeader(firstDate);
  const lastHeader = formatDateHeader(lastDate);
  const weekLabel =
    currentWeek.columns.length === 1
      ? firstHeader.label
      : `${firstHeader.label} - ${lastHeader.label}`;

  return (
    <>
      <div className="flex items-center justify-center px-4 py-3">
        <button
          type="button"
          className="flex cursor-pointer items-center justify-center"
          style={{ width: 44, height: 44 }}
          disabled={weekIdx === 0}
          onClick={() => setWeekIdx(weekIdx - 1)}
        >
          <ChevronLeft
            size={24}
            color={weekIdx === 0 ? adaptive.grey300 : adaptive.grey700}
          />
        </button>
        <button
          type="button"
          className="w-[140px] cursor-pointer text-center"
          style={{ fontSize: 16, color: adaptive.grey700 }}
          onClick={() => setIsOpen(true)}
        >
          {weekLabel}
        </button>
        <button
          type="button"
          className="flex cursor-pointer items-center justify-center"
          style={{ width: 44, height: 44 }}
          disabled={weekIdx === weeks.length - 1}
          onClick={() => setWeekIdx(weekIdx + 1)}
        >
          <ChevronRight
            size={24}
            color={
              weekIdx === weeks.length - 1 ? adaptive.grey300 : adaptive.grey700
            }
          />
        </button>
      </div>

      <BottomSheet
        open={isOpen}
        onClose={() => setIsOpen(false)}
        header={<BottomSheet.Header>날짜 보기</BottomSheet.Header>}
      >
        <CalendarView highlightedDates={highlightedDates} />
      </BottomSheet>
    </>
  );
}
