import { useCallback, useMemo, useState } from "react";
import { adaptive } from "@toss/tds-colors";
import { buildCalendarCells } from "@/lib/calendar";
import { buildRenderGrid2 } from "@/lib/renderGrid2";
import CalendarGrid2, { type CalendarCellModel } from "../CalendarGrid2";

const W = 7;
const H = 5;

function toDateKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function countColor(count: number) {
  if (count === 3) return { bg: adaptive.blue300, whiteText: true };
  if (count === 2) return { bg: adaptive.blue200, whiteText: true };
  if (count === 1) return { bg: adaptive.blue100, whiteText: false };
  return { bg: "white", whiteText: false };
}

interface CalendarViewProps {
  highlightedDates: Set<string>;
  selectedDates?: Set<string>;
  onDateClick?: (dateKey: string) => void;
}

export default function CalendarView({
  highlightedDates,
  selectedDates,
  onDateClick,
}: CalendarViewProps) {
  const cells = useMemo(() => buildCalendarCells(), []);
  const [pressedIdx, setPressedIdx] = useState<number | undefined>(undefined);

  const countGrid = useMemo(() => {
    const grid: number[][] = Array.from({ length: H }, () => Array(W).fill(0));
    for (let i = 0; i < cells.length; i++) {
      const key = toDateKey(cells[i].date);
      if (!highlightedDates.has(key)) continue;
      const r = Math.floor(i / W);
      const c = i % W;
      if (i === pressedIdx) {
        grid[r][c] = 1;
      } else if (selectedDates?.has(key)) {
        grid[r][c] = 3;
      } else {
        grid[r][c] = 2;
      }
    }
    return grid;
  }, [cells, highlightedDates, selectedDates, pressedIdx]);

  const renderGrid = useMemo(
    () => buildRenderGrid2(countGrid),
    [countGrid],
  );

  const calendarCells: CalendarCellModel[] = useMemo(() => {
    const today = new Date();
    const currentMonth = today.getMonth();

    return cells.map((cell, idx) => {
      const r = Math.floor(idx / W);
      const c = idx % W;
      const rc = renderGrid[r][c];
      const center = rc.center;
      const isCurrentMonth = cell.date.getMonth() === currentMonth;

      const { bg, whiteText } = countColor(center);
      const centerBg = center > 0 ? bg : undefined;
      const textColor =
        center > 0 && whiteText
          ? "#ffffff"
          : isCurrentMonth
            ? adaptive.grey800
            : adaptive.grey400;

      return {
        hidden: cell.hidden,
        day: cell.day,
        isToday: cell.isToday,
        textColor,
        center: centerBg,
        lt: countColor(rc.lt).bg,
        rt: countColor(rc.rt).bg,
        lb: countColor(rc.lb).bg,
        rb: countColor(rc.rb).bg,
      };
    });
  }, [cells, renderGrid]);

  const handlePressStart = useCallback(
    (idx: number) => {
      const cell = cells[idx];
      if (!cell) return;
      if (highlightedDates.has(toDateKey(cell.date))) {
        setPressedIdx(idx);
      }
    },
    [cells, highlightedDates],
  );

  const handlePressEnd = useCallback(() => {
    setPressedIdx(undefined);
  }, []);

  const handleCellClick = useCallback(
    (idx: number) => {
      const cell = cells[idx];
      if (!cell) return;
      const key = toDateKey(cell.date);
      if (!highlightedDates.has(key)) return;
      onDateClick?.(key);
    },
    [cells, highlightedDates, onDateClick],
  );

  return (
    <CalendarGrid2
      cells={calendarCells}
      onCellClick={handleCellClick}
      onCellPressStart={handlePressStart}
      onCellPressEnd={handlePressEnd}
    />
  );
}
