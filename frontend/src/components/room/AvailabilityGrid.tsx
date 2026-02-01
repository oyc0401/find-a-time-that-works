import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import { adaptive } from "@toss/tds-colors";
import { cn } from "@/lib/cn";
import { generateTimeSlots, formatDateHeader } from "@/lib/timeSlots";
import {
  type Owner,
  type RenderCell,
  type DragMode,
  buildRenderGrid,
} from "@/lib/renderGrid";
import { useAvailabilityStore } from "@/stores/useAvailabilityStore";
import { useRoomData } from "@/hooks/useRoomData";
import { useRoomStore } from "@/stores/useRoomStore";
import { useLongPressDrag } from "@/hooks/useLongPressDrag";
import WeekNavigation from "./WeekNavigation";

const CELL_H = 20;
const CORNER_SIZE = 4;

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

// =====================
// Corner rendering
// =====================

type CornerPos = "lt" | "rt" | "lb" | "rb";
const CORNERS: CornerPos[] = ["lt", "rt", "lb", "rb"];

function cornerStyle(pos: CornerPos): React.CSSProperties {
  const s: React.CSSProperties = {
    position: "absolute",
    width: CORNER_SIZE,
    height: CORNER_SIZE,
    pointerEvents: "none",
  };
  if (pos === "lt") {
    s.top = 0;
    s.left = 0;
  } else if (pos === "rt") {
    s.top = 0;
    s.right = 0;
  } else if (pos === "lb") {
    s.bottom = 0;
    s.left = 0;
  } else {
    s.bottom = 0;
    s.right = 0;
  }
  return s;
}

function roundClass(pos: CornerPos) {
  if (pos === "lt") return "rounded-tl";
  if (pos === "rt") return "rounded-tr";
  if (pos === "lb") return "rounded-bl";
  return "rounded-br";
}

function centerOwner(rc: RenderCell): Owner {
  return rc.lt.center;
}

function cornerOwner(rc: RenderCell, pos: CornerPos): Owner {
  if (pos === "lt") return rc.lt.corner;
  if (pos === "rt") return rc.rt.corner;
  if (pos === "lb") return rc.lb.corner;
  return rc.rb.corner;
}

function ownerBg(owner: Owner, dragMode: DragMode) {
  if (owner === "confirmed") return adaptive.blue400;
  if (owner === "preview")
    return dragMode === "select" ? adaptive.blue200 : adaptive.blue100;
  return "transparent";
}

function needsCornerOp(center: Owner, corner: Owner) {
  if (center !== "empty") return corner !== center;
  return corner !== "empty";
}

export default function AvailabilityGrid() {
  const { id } = useParams<{ id: string }>();
  const { room, weeks } = useRoomData(id);
  const { weekIdx } = useRoomStore();
  const columns = weeks[weekIdx]?.columns ?? [];
  const totalCols = room?.dates.length ?? 0;

  const timeSlots = useMemo(
    () =>
      generateTimeSlots(room?.startTime ?? "09:00", room?.endTime ?? "18:00"),
    [room?.startTime, room?.endTime],
  );
  const rows = timeSlots.length;
  const displayCols = columns.length;

  const { grid, select, deselect } = useAvailabilityStore();

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

  // storeCol → displayCol 변환된 confirmed 배열
  const displayConfirmed = useMemo(() => {
    const result: boolean[][] = [];
    for (let r = 0; r < rows; r++) {
      result[r] = [];
      for (let dc = 0; dc < displayCols; dc++) {
        const sc = columns[dc]?.storeColIdx;
        result[r][dc] = sc !== undefined && (grid[r]?.[sc] ?? false);
      }
    }
    return result;
  }, [grid, rows, displayCols, columns]);

  const renderGrid = useMemo(
    () =>
      displayCols > 0 && rows > 0
        ? buildRenderGrid({
            confirmed: displayConfirmed,
            preview: preview.length > 0 ? preview : makeEmptyPreview(),
            dragMode,
          })
        : [],
    [displayConfirmed, preview, dragMode, displayCols, rows, makeEmptyPreview],
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

  const { onPointerDown, onPointerMove, onPointerUp, onPointerCancel } = useLongPressDrag({
    getCellFromPoint,
    isSameCell,
    onLongPressStart: handleLongPressStart,
    onDrag: handleDrag,
    onTap: handleTap,
    onEnd: handleEnd,
  });

  if (grid.length === 0) return null;

  const dateHeaders = columns.map((col) => formatDateHeader(col.date));
  const baseBg = "white";

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
          onPointerCancel={onPointerCancel}
        >
          {columns.map((col, displayIdx) => (
            <div
              key={col.date}
              className="flex flex-1 flex-col"
              style={{ minWidth: 44 }}
            >
              {timeSlots.map((slot, rowIdx) => {
                const rc = renderGrid[rowIdx]?.[displayIdx];
                if (!rc) return null;

                const isHour = slot.endsWith(":00");
                const center = centerOwner(rc);
                const centerBg = ownerBg(center, dragMode);

                return (
                  <div
                    key={slot}
                    data-cell={`${rowIdx},${displayIdx}`}
                    className={cn(
                      "relative border-r border-gray-300",
                      isHour && "border-t border-gray-300",
                      displayIdx === 0 && "border-l border-gray-300",
                      rowIdx === timeSlots.length - 1 &&
                        "border-b border-gray-300",
                    )}
                    style={{ height: CELL_H }}
                  >
                    {/* Center fill */}
                    {center !== "empty" && (
                      <div
                        className="absolute inset-0 pointer-events-none"
                        style={{ backgroundColor: centerBg }}
                      />
                    )}

                    {/* Corner Color band */}
                    {CORNERS.map((pos) => {
                      const corner = cornerOwner(rc, pos);
                      if (!needsCornerOp(center, corner)) return null;

                      const outerColor =
                        center !== "empty"
                          ? corner === "empty"
                            ? baseBg
                            : ownerBg(corner, dragMode)
                          : ownerBg(corner, dragMode);

                      return (
                        <div
                          key={`corner-color-${pos}`}
                          className="pointer-events-none"
                          style={{
                            ...cornerStyle(pos),
                            backgroundColor: outerColor,
                          }}
                        />
                      );
                    })}

                    {/* Corner Cut band */}
                    {CORNERS.map((pos) => {
                      const corner = cornerOwner(rc, pos);
                      if (!needsCornerOp(center, corner)) return null;

                      const innerColor = center !== "empty" ? centerBg : baseBg;

                      return (
                        <div
                          key={`corner-cut-${pos}`}
                          className={cn("absolute pointer-events-none", roundClass(pos))}
                          style={{
                            ...cornerStyle(pos),
                            backgroundColor: innerColor,
                          }}
                        />
                      );
                    })}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
