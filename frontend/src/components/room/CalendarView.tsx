import { useCallback, useMemo, useState } from "react";
import { adaptive } from "@toss/tds-colors";
import { type CalendarCell, buildCalendarCells } from "@/lib/calendar";
import { type Owner, type RenderCell, buildRenderGrid } from "@/lib/renderGrid";
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

function ownerColor(owner: Owner) {
  if (owner === "confirmed") return { bg: adaptive.blue300, whiteText: true };
  if (owner === "preview") return { bg: adaptive.blue200, whiteText: true };
  return { bg: "white", whiteText: false };
}

function buildCalendarCellModels(
  cells: CalendarCell[],
  renderGrid: RenderCell[][],
  cellStyleMap?: Map<string, CellStyle>,
): CalendarCellModel[] {
  const today = new Date();
  const currentMonth = today.getMonth();

  return cells.map((cell, idx) => {
    const r = rowOf(idx);
    const c = colOf(idx);
    const rc = renderGrid[r][c];
    const dateKey = toDateKey(cell.date);

    const center = rc.lt.center;
    const isCurrentMonth = cell.date.getMonth() === currentMonth;

    // cellStyleMap에서 커스텀 스타일 확인
    const customStyle = cellStyleMap?.get(dateKey);
    let centerBg: string | undefined;
    let textColor: string;
    let text: string | number | undefined;

    if (customStyle && center !== "empty") {
      centerBg = customStyle.bg;
      textColor = customStyle.textColor;
      text = customStyle.text;
    } else {
      const { bg, whiteText } = ownerColor(center);
      centerBg = center !== "empty" ? bg : undefined;
      textColor =
        center !== "empty" && whiteText
          ? "#ffffff"
          : isCurrentMonth
            ? adaptive.grey800
            : adaptive.grey400;
    }

    // Corner colors
    const lt = ownerColor(rc.lt.corner).bg;
    const rt = ownerColor(rc.rt.corner).bg;
    const lb = ownerColor(rc.lb.corner).bg;
    const rb = ownerColor(rc.rb.corner).bg;

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

  const { confirmed, preview } = useMemo(() => {
    const conf: boolean[][] = Array.from({ length: H }, () =>
      Array(W).fill(false),
    );
    const prev: boolean[][] = Array.from({ length: H }, () =>
      Array(W).fill(false),
    );
    for (let i = 0; i < cells.length; i++) {
      if (highlightedDates.has(toDateKey(cells[i].date))) {
        if (i === pressedIdx) {
          prev[Math.floor(i / W)][i % W] = true;
        } else {
          conf[Math.floor(i / W)][i % W] = true;
        }
      }
    }
    return { confirmed: conf, preview: prev };
  }, [cells, highlightedDates, pressedIdx]);

  const renderGrid = useMemo(
    () => buildRenderGrid({ confirmed, preview, dragMode: "select" }),
    [confirmed, preview],
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
