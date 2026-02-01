import { adaptive } from "@toss/tds-colors";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { formatDateHeader } from "@/lib/timeSlots";
import { useRoomStore } from "@/stores/useRoomStore";

export default function WeekNavigation() {
  const { weeks, weekIdx, setWeekIdx } = useRoomStore();

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
    <div className="sticky top-0 z-10 flex items-center justify-center gap-4 px-4 py-3">
      <button
        type="button"
        className="cursor-pointer p-1"
        disabled={weekIdx === 0}
        onClick={() => setWeekIdx(weekIdx - 1)}
      >
        <ChevronLeft
          size={20}
          color={weekIdx === 0 ? adaptive.grey300 : adaptive.grey700}
        />
      </button>
      <span style={{ fontSize: 14, color: adaptive.grey700 }}>{weekLabel}</span>
      <button
        type="button"
        className="cursor-pointer p-1"
        disabled={weekIdx === weeks.length - 1}
        onClick={() => setWeekIdx(weekIdx + 1)}
      >
        <ChevronRight
          size={20}
          color={
            weekIdx === weeks.length - 1 ? adaptive.grey300 : adaptive.grey700
          }
        />
      </button>
    </div>
  );
}
