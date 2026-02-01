import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type React from "react";
import { adaptive } from "@toss/tds-colors";
import { cn } from "@/lib/cn";
import { generateTimeSlots, formatDateHeader } from "@/lib/timeSlots";
import { useAvailabilityStore } from "@/stores/useAvailabilityStore";
import type { WeekColumn } from "@/lib/weekGroup";

interface Props {
  columns: WeekColumn[];
  totalCols: number;
  startTime: string;
  endTime: string;
}

const CELL_H = 20;

type DragMode = "select" | "deselect";

function getCellFromPoint(x: number, y: number) {
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

export default function AvailabilityGrid({
  columns,
  totalCols,
  startTime,
  endTime,
}: Props) {
  const timeSlots = useMemo(
    () => generateTimeSlots(startTime, endTime),
    [startTime, endTime],
  );
  const rows = timeSlots.length;
  const displayCols = columns.length;

  const { grid, init, select, deselect } = useAvailabilityStore();

  useEffect(() => {
    init(rows, totalCols);
  }, [rows, totalCols, init]);

  const [preview, setPreview] = useState<boolean[][]>([]);
  const [dragMode, setDragMode] = useState<DragMode>("select");
  const startCell = useRef<{ row: number; displayCol: number }>();
  const currentRect = useRef<{
    r0: number;
    r1: number;
    dc0: number;
    dc1: number;
  }>();
  const isDragging = useRef(false);

  const makeEmptyPreview = useCallback(
    () => Array.from({ length: rows }, () => Array(displayCols).fill(false)),
    [rows, displayCols],
  );

  const handlePointerDown = useCallback(
    (e: React.PointerEvent) => {
      const cell = getCellFromPoint(e.clientX, e.clientY);
      if (!cell) return;

      const displayCol = cell.col;
      const storeCol = columns[displayCol]?.storeColIdx;
      if (storeCol === undefined) return;

      isDragging.current = true;
      startCell.current = { row: cell.row, displayCol };

      const mode: DragMode = grid[cell.row]?.[storeCol] ? "deselect" : "select";
      setDragMode(mode);

      const rect = {
        r0: cell.row,
        r1: cell.row,
        dc0: displayCol,
        dc1: displayCol,
      };
      currentRect.current = rect;

      const p = makeEmptyPreview();
      p[cell.row][displayCol] = true;
      setPreview(p);

      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    },
    [grid, columns, makeEmptyPreview],
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!isDragging.current || !startCell.current) return;

      const cell = getCellFromPoint(e.clientX, e.clientY);
      if (!cell) return;

      const s = startCell.current;
      const rect = {
        r0: Math.min(s.row, cell.row),
        r1: Math.max(s.row, cell.row),
        dc0: Math.min(s.displayCol, cell.col),
        dc1: Math.max(s.displayCol, cell.col),
      };
      currentRect.current = rect;

      const p = makeEmptyPreview();
      for (let r = rect.r0; r <= rect.r1; r++)
        for (let dc = rect.dc0; dc <= rect.dc1; dc++) p[r][dc] = true;
      setPreview(p);
    },
    [makeEmptyPreview],
  );

  const handlePointerUp = useCallback(() => {
    isDragging.current = false;
    startCell.current = undefined;

    const rect = currentRect.current;
    if (rect) {
      for (let r = rect.r0; r <= rect.r1; r++) {
        for (let dc = rect.dc0; dc <= rect.dc1; dc++) {
          const sc = columns[dc]?.storeColIdx;
          if (sc === undefined) continue;
          if (dragMode === "select") select(r, r, sc, sc);
          else deselect(r, r, sc, sc);
        }
      }
    }
    currentRect.current = undefined;
    setPreview(makeEmptyPreview());
  }, [dragMode, select, deselect, columns, makeEmptyPreview]);

  if (grid.length === 0) return null;

  const dateHeaders = columns.map((col) => formatDateHeader(col.date));

  return (
    <div className="w-full overflow-x-auto px-4 py-3">
      {/* Date headers */}
      <div className="flex" style={{ paddingLeft: 28 }}>
        {dateHeaders.map((h, i) => (
          <div
            key={columns[i].date}
            className="flex-1 text-center"
            style={{ minWidth: 44 }}
          >
            <div style={{ fontSize: 13, color: adaptive.grey500 }}>
              {h.weekday}
            </div>
            <div style={{ fontSize: 13, color: adaptive.grey700 }}>
              {h.label}
            </div>
          </div>
        ))}
      </div>

      {/* Grid body */}
      <div className="mt-2 flex">
        {/* Time labels */}
        <div className="shrink-0" style={{ width: 16 }}>
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
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
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
