import { useMemo } from "react";
import { useParams } from "react-router-dom";
import { adaptive } from "@toss/tds-colors";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { formatDateHeader } from "@/lib/timeSlots";
import { useRoomData } from "@/hooks/useRoomData";
import { useRoomStore } from "@/stores/useRoomStore";

interface WeekNavigationProps {
  onDateClick?: () => void;
}

export default function WeekNavigation({ onDateClick }: WeekNavigationProps) {
  const { id } = useParams<{ id: string }>();
  const { weeks } = useRoomData(id);
  const { weekIdx, setWeekIdx } = useRoomStore();

  const weekLabel = useMemo(() => {
    const currentWeek = weeks[weekIdx];
    if (!currentWeek) return undefined;
    const firstDate = currentWeek.columns[0].date;
    const lastDate = currentWeek.columns[currentWeek.columns.length - 1].date;
    const firstHeader = formatDateHeader(firstDate);
    const lastHeader = formatDateHeader(lastDate);
    return currentWeek.columns.length === 1
      ? firstHeader.label
      : `${firstHeader.label} - ${lastHeader.label}`;
  }, [weeks, weekIdx]);

  if (weeks.length <= 1) return null;
  if (!weekLabel) return null;

  return (
    <div className="flex items-center py-3">
      <button
        type="button"
        className="flex cursor-pointer items-center justify-center"
        style={{ width: 44, height: 44 }}
        disabled={weekIdx === 0}
        onClick={() => setWeekIdx(weekIdx - 1)}
      >
        <ChevronLeft
          size={24}
          color={weekIdx === 0 ? adaptive.grey300 : adaptive.grey800}
        />
      </button>
      <button
        type="button"
        className="w-[140px] cursor-pointer text-center"
        style={{ fontSize: 16, color: adaptive.grey800 }}
        onClick={onDateClick}
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
            weekIdx === weeks.length - 1 ? adaptive.grey300 : adaptive.grey800
          }
        />
      </button>
    </div>
  );
}
