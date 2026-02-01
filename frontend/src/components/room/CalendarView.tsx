import { useCallback, useMemo, useState } from "react";
import { adaptive } from "@toss/tds-colors";
import { buildCalendarCells } from "@/lib/calendar";
import { type Owner, buildRenderGrid } from "@/lib/renderGrid";
import CalendarGrid from "../CalendarGrid";

const W = 7;
const H = 5;

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

  const colorOf = useCallback(
    (owner: Owner, dateKey?: string) => {
      // cellStyleMap이 있고 해당 날짜에 스타일이 있으면 사용
      if (cellStyleMap && dateKey) {
        const style = cellStyleMap.get(dateKey);
        if (style && owner !== "empty") {
          const whiteText = style.textColor === "#ffffff" || style.textColor === "#fff";
          return { bg: style.bg, whiteText, text: style.text };
        }
      }

      // 기본 색상
      if (owner === "confirmed")
        return { bg: adaptive.blue300, whiteText: true };
      if (owner === "preview")
        return { bg: adaptive.blue200, whiteText: true };
      return { bg: "white", whiteText: false };
    },
    [cellStyleMap],
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
    <CalendarGrid
      renderGrid={renderGrid}
      colorOf={colorOf}
      onCellClick={handleCellClick}
      onCellPressStart={handlePressStart}
      onCellPressEnd={handlePressEnd}
    />
  );
}
