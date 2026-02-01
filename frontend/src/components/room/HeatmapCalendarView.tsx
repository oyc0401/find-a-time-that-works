import { useCallback, useMemo } from "react";
import { adaptive } from "@toss/tds-colors";
import { buildCalendarCells } from "@/lib/calendar";
import { buildRenderGrid2 } from "@/lib/renderGrid2";
import { heatColor } from "@/lib/heatColor";
import CalendarGrid2, { type CalendarCellModel } from "../CalendarGrid2";

const W = 7;
const H = 5;

function toDateKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function countToHeatBg(count: number, maxCount: number): string {
  if (count <= 0) return "white";
  const ratio = maxCount > 0 ? (count - 1) / maxCount : 0;
  return heatColor(ratio);
}

interface HeatmapCalendarViewProps {
  highlightedDates: Set<string>;
  dateCountMap: Map<string, number>;
  maxCount: number;
  onDateClick?: (dateKey: string) => void;
}

export default function HeatmapCalendarView({
  highlightedDates,
  dateCountMap,
  maxCount,
  onDateClick,
}: HeatmapCalendarViewProps) {
  const cells = useMemo(() => buildCalendarCells(), []);

  // 가중치 기반 countGrid: 참여인원 + 1 (0은 빈칸 전용)
  const countGrid = useMemo(() => {
    const grid: number[][] = Array.from({ length: H }, () => Array(W).fill(0));
    for (let i = 0; i < cells.length; i++) {
      const dateKey = toDateKey(cells[i].date);
      if (!highlightedDates.has(dateKey)) continue;
      const r = Math.floor(i / W);
      const c = i % W;
      grid[r][c] = (dateCountMap.get(dateKey) ?? 0) + 1;
    }
    return grid;
  }, [cells, highlightedDates, dateCountMap]);

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
      const dateKey = toDateKey(cell.date);
      const count = dateCountMap.get(dateKey) ?? 0;

      const centerBg = center > 0 ? countToHeatBg(center, maxCount) : undefined;
      const textColor =
        center > 0 && count / maxCount > 0.5
          ? "#fff"
          : isCurrentMonth
            ? adaptive.grey800
            : adaptive.grey400;

      return {
        hidden: cell.hidden,
        day: cell.day,
        text: center > 0 ? String(count) : undefined,
        isToday: cell.isToday,
        textColor,
        center: centerBg,
        lt: countToHeatBg(rc.lt, maxCount),
        rt: countToHeatBg(rc.rt, maxCount),
        lb: countToHeatBg(rc.lb, maxCount),
        rb: countToHeatBg(rc.rb, maxCount),
      };
    });
  }, [cells, renderGrid, dateCountMap, maxCount]);

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
    />
  );
}
