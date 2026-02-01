import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { adaptive } from "@toss/tds-colors";
import { cn } from "@/lib/cn";
import { generateTimeSlots, formatDateHeader } from "@/lib/timeSlots";
import { useAvailabilityStore } from "@/stores/useAvailabilityStore";
import { useRoomStore } from "@/stores/useRoomStore";
import { useLongPressDrag } from "@/hooks/useLongPressDrag";
import WeekNavigation from "./WeekNavigation";

const CELL_H = 20;

type DragMode = "select" | "deselect";
type Cell = { row: number; col: number };

function getCellFromPoint(x: number, y: number): Cell | undefined {
  const el = document.elementFromPoint(x, y);
  if (!el) return undefined;
  const cellEl = el.closest("[data-cell]");
  if (!cellEl) return undefined;
  const attr = cellEl.getAttribute("data-cell");
  if (!attr) return undefined;
  const [r, c] = attr.split(",").map(Number);
  if (Number.isNaN(r) || Number.isNaN(c)) return undefined;
  return { row: r, col: c };
}

function isSameCell(a: Cell, b: Cell): boolean {
  return a.row === b.row && a.col === b.col;
}

export default function AvailabilityGrid() {
  const { room, weeks, weekIdx } = useRoomStore();
  const columns = weeks[weekIdx]?.columns ?? [];
  const totalCols = room?.dates.length ?? 0;

  const timeSlots = useMemo(
    () =>
      generateTimeSlots(room?.startTime ?? "09:00", room?.endTime ?? "18:00"),
    [room?.startTime, room?.endTime],
  );
  const rows = timeSlots.length;
  const displayCols = columns.length;

  const { grid, init, select, deselect } = useAvailabilityStore();

  useEffect(() => {
    if (totalCols > 0) {
      init(rows, totalCols);
    }
  }, [rows, totalCols, init]);

  const [preview, setPreview] = useState<boolean[][]>([]);
  const [dragMode, setDragMode] = useState<DragMode>("select");

  const startCell = useRef<Cell | undefined>(undefined);
  const currentRect = useRef<{
    r0: number;
    r1: number;
    dc0: number;
    dc1: number;
  }>();

  const makeEmptyPreview = useCallback(
    () => Array.from({ length: rows }, () => Array(displayCols).fill(false)),
    [rows, displayCols],
  );

  const applySelection = useCallback(
    (rect: { r0: number; r1: number; dc0: number; dc1: number }) => {
      for (let r = rect.r0; r <= rect.r1; r++) {
        for (let dc = rect.dc0; dc <= rect.dc1; dc++) {
          const sc = columns[dc]?.storeColIdx;
          if (sc === undefined) continue;
          if (dragMode === "select") select(r, r, sc, sc);
          else deselect(r, r, sc, sc);
        }
      }
    },
    [dragMode, select, deselect, columns],
  );

  const handleLongPressStart = useCallback(
    (cell: Cell) => {
      const storeCol = columns[cell.col]?.storeColIdx;
      if (storeCol === undefined) return;

      startCell.current = cell;

      const mode: DragMode = grid[cell.row]?.[storeCol] ? "deselect" : "select";
      setDragMode(mode);

      const rect = {
        r0: cell.row,
        r1: cell.row,
        dc0: cell.col,
        dc1: cell.col,
      };
      currentRect.current = rect;

      const p = makeEmptyPreview();
      p[cell.row][cell.col] = true;
      setPreview(p);
    },
    [grid, columns, makeEmptyPreview],
  );

  const handleDrag = useCallback(
    (cell: Cell) => {
      if (!startCell.current) return;

      const s = startCell.current;
      const rect = {
        r0: Math.min(s.row, cell.row),
        r1: Math.max(s.row, cell.row),
        dc0: Math.min(s.col, cell.col),
        dc1: Math.max(s.col, cell.col),
      };
      currentRect.current = rect;

      const p = makeEmptyPreview();
      for (let r = rect.r0; r <= rect.r1; r++) {
        for (let dc = rect.dc0; dc <= rect.dc1; dc++) {
          p[r][dc] = true;
        }
      }
      setPreview(p);
    },
    [makeEmptyPreview],
  );

  const handleTap = useCallback(
    (cell: Cell) => {
      const storeCol = columns[cell.col]?.storeColIdx;
      if (storeCol === undefined) return;

      const mode: DragMode = grid[cell.row]?.[storeCol] ? "deselect" : "select";
      if (mode === "select") select(cell.row, cell.row, storeCol, storeCol);
      else deselect(cell.row, cell.row, storeCol, storeCol);
    },
    [grid, columns, select, deselect],
  );

  const handleEnd = useCallback(() => {
    const rect = currentRect.current;
    if (rect) {
      applySelection(rect);
    }

    startCell.current = undefined;
    currentRect.current = undefined;
    setPreview(makeEmptyPreview());
  }, [applySelection, makeEmptyPreview]);

  const { onPointerDown, onPointerMove, onPointerUp } = useLongPressDrag({
    getCellFromPoint,
    isSameCell,
    onLongPressStart: handleLongPressStart,
    onDrag: handleDrag,
    onTap: handleTap,
    onEnd: handleEnd,
  });

  if (grid.length === 0) return null;

  const dateHeaders = columns.map((col) => formatDateHeader(col.date));

  const TIME_WIDTH = 16;
  return (
    <div className="w-full">
      <div className=" bg-white px-4">
        <WeekNavigation />
        {/* Date headers */}
        <div className="flex " style={{ paddingLeft: TIME_WIDTH }}>
          {dateHeaders.map((h, i) => (
            <div
              key={columns[i].date}
              className="flex-1 text-center"
              style={{ minWidth: 44 }}
            >
              <div style={{ fontSize: 13, color: adaptive.grey500 }}>
                {`${h.day} (${h.weekday})`}
              </div>
            </div>
          ))}
        </div>
      </div>
      {/* Grid body */}
      <div className="mt-2 px-4 flex">
        {/* Time labels */}
        <div className="shrink-0" style={{ width: TIME_WIDTH }}>
          {timeSlots.map((slot) => {
            const isHour = slot.endsWith(":00");
            const hour = Number.parseInt(slot.split(":")[0]);
            return (
              <div key={slot} className="relative" style={{ height: CELL_H }}>
                {isHour && (
                  <span
                    className="absolute right-1.5"
                    style={{
                      top: -8,
                      fontSize: 12,
                      lineHeight: "16px",
                      color: adaptive.grey500,
                    }}
                  >
                    {hour}
                  </span>
                )}
              </div>
            );
          })}
        </div>

        {/* Cells */}
        <div
          className="flex flex-1"
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
          style={{ touchAction: "none" }}
        >
          {columns.map((col, displayIdx) => (
            <div
              key={col.date}
              className="flex flex-1 flex-col"
              style={{ minWidth: 44 }}
            >
              {timeSlots.map((slot, rowIdx) => {
                const isSelected = grid[rowIdx]?.[col.storeColIdx];
                const isPreviewing = preview[rowIdx]?.[displayIdx];
                const isHour = slot.endsWith(":00");

                let bg = "transparent";
                if (isSelected && isPreviewing && dragMode === "deselect") {
                  bg = adaptive.blue100;
                } else if (isSelected) {
                  bg = adaptive.blue400;
                } else if (isPreviewing) {
                  bg = adaptive.blue200;
                }

                return (
                  <div
                    key={slot}
                    data-cell={`${rowIdx},${displayIdx}`}
                    className={cn(
                      "border-r border-gray-300",
                      isHour && "border-t border-gray-300",
                      displayIdx === 0 && "border-l border-gray-300",
                      rowIdx === timeSlots.length - 1 &&
                        "border-b border-gray-300",
                    )}
                    style={{
                      height: CELL_H,
                      backgroundColor: bg,
                    }}
                  />
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
