import { useCallback, useMemo, useState } from "react";
import { adaptive } from "@toss/tds-colors";
import { type CalendarCell, buildCalendarCells } from "@/lib/calendar";
import { type RenderCell2, buildRenderGrid2 } from "@/lib/renderGrid2";
import CalendarGrid2, { type CalendarCellModel } from "../CalendarGrid2";

const W = 7;
const H = 5;

function rowOf(i: number) {
  return (i / W) | 0;
}

function colOf(i: number) {
  return i % W;
}

function toDateKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

interface CellStyle {
  date: string;
  bg: string;
  textColor: string;
  text?: string;
}

// count → 색상 변환 (0=empty, 1=preview, 2=confirmed)
function countColor(count: number) {
  if (count === 2) return { bg: adaptive.blue300, whiteText: true };
  if (count === 1) return { bg: adaptive.blue200, whiteText: true };
  return { bg: "white", whiteText: false };
}

function buildCalendarCellModels(
  cells: CalendarCell[],
  renderGrid: RenderCell2[][],
  cellStyleMap?: Map<string, CellStyle>,
): CalendarCellModel[] {
  const today = new Date();
  const currentMonth = today.getMonth();

  return cells.map((cell, idx) => {
    const r = rowOf(idx);
    const c = colOf(idx);
    const rc = renderGrid[r][c];
    const dateKey = toDateKey(cell.date);

    const center = rc.center;
    const isCurrentMonth = cell.date.getMonth() === currentMonth;

    // cellStyleMap에서 커스텀 스타일 확인
    const customStyle = cellStyleMap?.get(dateKey);
    let centerBg: string | undefined;
    let textColor: string;
    let text: string | number | undefined;

    if (customStyle && center > 0) {
      centerBg = customStyle.bg;
      textColor = customStyle.textColor;
      text = customStyle.text;
    } else {
      const { bg, whiteText } = countColor(center);
      centerBg = center > 0 ? bg : undefined;
      textColor =
        center > 0 && whiteText
          ? "#ffffff"
          : isCurrentMonth
            ? adaptive.grey800
            : adaptive.grey400;
    }

    // Corner colors
    const lt = countColor(rc.lt).bg;
    const rt = countColor(rc.rt).bg;
    const lb = countColor(rc.lb).bg;
    const rb = countColor(rc.rb).bg;

    return {
      hidden: cell.hidden,
      day: cell.day,
      text,
      isToday: cell.isToday,
      textColor,
      center: centerBg,
      lt,
      rt,
      lb,
      rb,
    };
  });
}

interface CalendarViewProps {
  highlightedDates: Set<string>;
  cellStyles?: CellStyle[];
  onDateClick?: (dateKey: string) => void;
}

export default function CalendarView({
  highlightedDates,
  cellStyles,
  onDateClick,
}: CalendarViewProps) {
  const cellStyleMap = useMemo(() => {
    if (!cellStyles) return undefined;
    const map = new Map<string, CellStyle>();
    for (const style of cellStyles) {
      map.set(style.date, style);
    }
    return map;
  }, [cellStyles]);

  const cells = useMemo(() => buildCalendarCells(), []);
  const [pressedIdx, setPressedIdx] = useState<number | undefined>(undefined);

  // boolean[][] → number[][] 변환 (confirmed=2, preview=1, empty=0)
  const countGrid = useMemo(() => {
    const grid: number[][] = Array.from({ length: H }, () => Array(W).fill(0));
    for (let i = 0; i < cells.length; i++) {
      if (highlightedDates.has(toDateKey(cells[i].date))) {
        const r = Math.floor(i / W);
        const c = i % W;
        if (i === pressedIdx) {
          grid[r][c] = 1; // preview
        } else {
          grid[r][c] = 2; // confirmed
        }
      }
    }
    return grid;
  }, [cells, highlightedDates, pressedIdx]);

  const renderGrid = useMemo(
    () => buildRenderGrid2(countGrid),
    [countGrid],
  );

  const calendarCells = useMemo(
    () => buildCalendarCellModels(cells, renderGrid, cellStyleMap),
    [cells, renderGrid, cellStyleMap],
  );

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
