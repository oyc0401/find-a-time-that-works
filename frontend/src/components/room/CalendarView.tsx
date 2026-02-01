import { useCallback, useMemo } from "react";
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

interface CalendarViewProps {
  highlightedDates: Set<string>;
}

export default function CalendarView({ highlightedDates }: CalendarViewProps) {
  const cells = useMemo(() => buildCalendarCells(), []);

  const confirmed = useMemo(() => {
    const grid: boolean[][] = Array.from({ length: H }, () =>
      Array(W).fill(false),
    );
    for (let i = 0; i < cells.length; i++) {
      if (highlightedDates.has(toDateKey(cells[i].date))) {
        grid[Math.floor(i / W)][i % W] = true;
      }
    }
    return grid;
  }, [cells, highlightedDates]);

  const emptyPreview = useMemo(
    () => Array.from({ length: H }, () => Array<boolean>(W).fill(false)),
    [],
  );

  const renderGrid = useMemo(
    () =>
      buildRenderGrid({ confirmed, preview: emptyPreview, dragMode: "select" }),
    [confirmed, emptyPreview],
  );

  const colorOf = useCallback((owner: Owner) => {
    if (owner === "confirmed")
      return { bg: adaptive.blue300, whiteText: true };
    return { bg: "white", whiteText: false };
  }, []);

  return <CalendarGrid renderGrid={renderGrid} colorOf={colorOf} />;
}
