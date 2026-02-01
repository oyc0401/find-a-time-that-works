import { useCallback, useMemo, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import { adaptive } from "@toss/tds-colors";
import { cn } from "@/lib/cn";
import { generateTimeSlots, formatDateHeader } from "@/lib/timeSlots";
import { type Owner, type RenderCell, buildRenderGrid } from "@/lib/renderGrid";
import { useRoomData } from "@/hooks/useRoomData";
import { useRoomStore } from "@/stores/useRoomStore";
import { heatColor } from "@/lib/heatColor";
import { useLongPressDrag } from "@/hooks/useLongPressDrag";
import WeekNavigation from "./WeekNavigation";

const CELL_H = 20;
const CORNER_SIZE = 4;
const TIME_WIDTH = 16;

type Cell = { row: number; col: number };
type Rect = { r0: number; r1: number; dc0: number; dc1: number };
type CornerPos = "lt" | "rt" | "lb" | "rb";
const CORNERS: CornerPos[] = ["lt", "rt", "lb", "rb"];

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

function intensityColor(count: number, max: number): string {
  if (count === 0 || max === 0) return "transparent";
  return heatColor(count / max);
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

function needsCornerOp(center: Owner, corner: Owner) {
  if (center !== "empty") return corner !== center;
  return corner !== "empty";
}

export default function OverviewGrid() {
  const { id } = useParams<{ id: string }>();
  const { room, participants, weeks } = useRoomData(id);
  const { weekIdx } = useRoomStore();
  const columns = weeks[weekIdx]?.columns ?? [];

  const timeSlots = useMemo(
    () =>
      generateTimeSlots(room?.startTime ?? "09:00", room?.endTime ?? "18:00"),
    [room?.startTime, room?.endTime],
  );

  const rows = timeSlots.length;
  const displayCols = columns.length;

  // ── Heatmap data ──
  const countMap = useMemo(() => {
    const map = new Map<string, number>();
    for (const p of participants) {
      for (const slot of p.slots) {
        const key = `${slot.date}|${slot.time}`;
        map.set(key, (map.get(key) ?? 0) + 1);
      }
    }
    return map;
  }, [participants]);

  const maxCount = participants.length;

  const countGrid = useMemo(() => {
    const result: number[][] = [];
    for (let r = 0; r < rows; r++) {
      result[r] = [];
      for (let dc = 0; dc < displayCols; dc++) {
        const date = columns[dc]?.date;
        const slot = timeSlots[r];
        result[r][dc] =
          date && slot ? (countMap.get(`${date}|${slot}`) ?? 0) : 0;
      }
    }
    return result;
  }, [rows, displayCols, columns, timeSlots, countMap]);

  const filledGrid = useMemo(
    () => countGrid.map((row) => row.map((c) => c > 0)),
    [countGrid],
  );

  // ── Selection state ──
  const [selectionRect, setSelectionRect] = useState<Rect>();
  const [previewRect, setPreviewRect] = useState<Rect>();

  const startCell = useRef<Cell | undefined>(undefined);
  const currentRect = useRef<Rect>();

  // ── RenderGrid ──
  const emptyPreview = useMemo(
    () =>
      Array.from(
        { length: rows },
        () => Array(displayCols).fill(false) as boolean[],
      ),
    [rows, displayCols],
  );

  const heatRenderGrid = useMemo(
    () =>
      displayCols > 0 && rows > 0
        ? buildRenderGrid({
            confirmed: filledGrid,
            preview: emptyPreview,
            dragMode: "select",
          })
        : [],
    [filledGrid, emptyPreview, displayCols, rows],
  );

  // ── Drag handlers ──
  const handleLongPressStart = useCallback((cell: Cell) => {
    startCell.current = cell;

    const rect: Rect = {
      r0: cell.row,
      r1: cell.row,
      dc0: cell.col,
      dc1: cell.col,
    };
    currentRect.current = rect;
    setSelectionRect(undefined);
    setPreviewRect(rect);
  }, []);

  const handleDrag = useCallback((cell: Cell) => {
    if (!startCell.current) return;
    const s = startCell.current;
    const rect: Rect = {
      r0: Math.min(s.row, cell.row),
      r1: Math.max(s.row, cell.row),
      dc0: Math.min(s.col, cell.col),
      dc1: Math.max(s.col, cell.col),
    };
    currentRect.current = rect;
    setPreviewRect(rect);
  }, []);

  const handleTap = useCallback((cell: Cell) => {
    setSelectionRect({
      r0: cell.row,
      r1: cell.row,
      dc0: cell.col,
      dc1: cell.col,
    });
  }, []);

  const handleEnd = useCallback(() => {
    const rect = currentRect.current;
    if (rect) {
      setSelectionRect(rect);
    }
    startCell.current = undefined;
    currentRect.current = undefined;
    setPreviewRect(undefined);
  }, []);

  const { onPointerDown, onPointerMove, onPointerUp, onPointerCancel } =
    useLongPressDrag({
      getCellFromPoint,
      isSameCell,
      onLongPressStart: handleLongPressStart,
      onDrag: handleDrag,
      onTap: handleTap,
      onEnd: handleEnd,
    });

  // ── Participant panel data ──
  const activeRect = previewRect ?? selectionRect;

  const selectedSlots = useMemo(() => {
    if (!activeRect) return [];
    const slots: { date: string; time: string }[] = [];
    for (let r = activeRect.r0; r <= activeRect.r1; r++) {
      for (let dc = activeRect.dc0; dc <= activeRect.dc1; dc++) {
        const date = columns[dc]?.date;
        const time = timeSlots[r];
        if (date && time) slots.push({ date, time });
      }
    }
    return slots;
  }, [activeRect, columns, timeSlots]);

  const participantCoverage = useMemo(() => {
    if (selectedSlots.length === 0) return [];

    const slotKeys = new Set(selectedSlots.map((s) => `${s.date}|${s.time}`));

    return participants
      .map((p) => {
        const covered = p.slots.filter((s) =>
          slotKeys.has(`${s.date}|${s.time}`),
        ).length;
        return { name: p.name, covered, total: selectedSlots.length };
      })
      .filter((p) => p.covered > 0)
      .sort((a, b) => b.covered - a.covered);
  }, [selectedSlots, participants]);

  const dateHeaders = columns.map((col) => formatDateHeader(col.date));
  const baseBg = "white";

  const overlayRect = previewRect ?? selectionRect;

  return (
    <div className="w-full">
      <div className="bg-white px-4">
        <WeekNavigation />
        <div className="flex" style={{ paddingLeft: TIME_WIDTH }}>
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
          className="relative flex flex-1"
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
                const count = countGrid[rowIdx]?.[displayIdx] ?? 0;
                const isHour = slot.endsWith(":00");
                const rc: RenderCell | undefined =
                  heatRenderGrid[rowIdx]?.[displayIdx];
                if (!rc) return null;

                const isFilled = count > 0;
                const cellBg = intensityColor(count, maxCount);
                const center = centerOwner(rc);

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
                    {isFilled && (
                      <div
                        className="absolute inset-0 pointer-events-none"
                        style={{ backgroundColor: cellBg }}
                      />
                    )}

                    {/* Corner color band */}
                    {CORNERS.map((pos) => {
                      const corner = cornerOwner(rc, pos);
                      if (!needsCornerOp(center, corner)) return null;

                      let outerColor: string;
                      if (center !== "empty" && corner === "empty") {
                        outerColor = baseBg;
                      } else if (center !== "empty") {
                        outerColor = cellBg;
                      } else {
                        const nr =
                          pos === "lt" || pos === "rt"
                            ? rowIdx - 1
                            : rowIdx + 1;
                        const nc =
                          pos === "lt" || pos === "lb"
                            ? displayIdx - 1
                            : displayIdx + 1;
                        const nCount = countGrid[nr]?.[nc] ?? 0;
                        outerColor = intensityColor(nCount, maxCount);
                      }

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

                    {/* Corner cut band */}
                    {CORNERS.map((pos) => {
                      const corner = cornerOwner(rc, pos);
                      if (!needsCornerOp(center, corner)) return null;

                      const innerColor = center !== "empty" ? cellBg : baseBg;

                      return (
                        <div
                          key={`corner-cut-${pos}`}
                          className={cn(
                            "absolute pointer-events-none",
                            roundClass(pos),
                          )}
                          style={{
                            ...cornerStyle(pos),
                            backgroundColor: innerColor,
                          }}
                        />
                      );
                    })}

                    {/* Count label */}
                    {count > 0 && (
                      <span
                        className="absolute inset-0 flex items-center justify-center pointer-events-none"
                        style={{
                          fontSize: 10,
                          color:
                            count / maxCount > 0.5 ? "#fff" : adaptive.grey600,
                        }}
                      >
                        {count}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          ))}

          {/* Selection overlay */}
          {overlayRect && displayCols > 0 && (
            <div
              className="absolute pointer-events-none"
              style={{
                top: overlayRect.r0 * CELL_H,
                height: (overlayRect.r1 - overlayRect.r0 + 1) * CELL_H,
                left: `${(overlayRect.dc0 / displayCols) * 100}%`,
                width: `${((overlayRect.dc1 - overlayRect.dc0 + 1) / displayCols) * 100}%`,
                backgroundColor: "#feafb445",
                border: "2px solid #f66570",
              }}
            />
          )}
        </div>
      </div>

      {/* Legend */}
      {participants.length > 0 && (
        <div
          className="mt-3 px-4 flex items-center justify-end gap-2"
          style={{ fontSize: 11, color: adaptive.grey500 }}
        >
          <span>0/{maxCount}</span>
          <div className="flex">
            {Array.from({ length: 7 }, (_, i) => {
              const ratio = (i + 1) / 7;
              return (
                <div
                  key={i}
                  style={{
                    width: 10,
                    height: 12,
                    backgroundColor: heatColor(ratio),
                  }}
                  className={cn(
                    i === 0 && "rounded-l-sm",
                    i === 6 && "rounded-r-sm",
                  )}
                />
              );
            })}
          </div>
          <span>
            {maxCount}/{maxCount}
          </span>
        </div>
      )}

      {/* Participant panel */}
      {participantCoverage.length > 0 && (
        <div className="mt-4 mx-4 rounded-xl bg-gray-50 p-4">
          <div
            style={{ fontSize: 13, color: adaptive.grey600 }}
            className="mb-2"
          >
            선택한 {selectedSlots.length}개 슬롯에 참여 가능한 사람
          </div>
          <div className="flex flex-col gap-2">
            {participantCoverage.map((p) => (
              <div key={p.name} className="flex items-center justify-between">
                <span style={{ fontSize: 14, color: adaptive.grey900 }}>
                  {p.name}
                </span>
                <span style={{ fontSize: 13, color: adaptive.grey500 }}>
                  {p.covered}/{p.total}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
