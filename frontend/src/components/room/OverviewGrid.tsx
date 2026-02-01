import { useCallback, useMemo, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import { adaptive } from "@toss/tds-colors";
import { BottomSheet } from "@toss/tds-mobile";
import { cn } from "@/lib/cn";
import { generateTimeSlots, formatDateHeader } from "@/lib/timeSlots";
import { buildRenderGrid2 } from "@/lib/renderGrid2";
import { useRoomData } from "@/hooks/useRoomData";
import { useRoomStore } from "@/stores/useRoomStore";
import { heatColor } from "@/lib/heatColor";
import { useLongPressDrag } from "@/hooks/useLongPressDrag";
import HeatmapCalendarView from "./HeatmapCalendarView";
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

export default function OverviewGrid() {
  const { id } = useParams<{ id: string }>();
  const { room, participants, weeks } = useRoomData(id);
  const { weekIdx, setWeekIdx } = useRoomStore();
  const columns = weeks[weekIdx]?.columns ?? [];

  const timeSlots = useMemo(
    () =>
      generateTimeSlots(room?.startTime ?? "09:00", room?.endTime ?? "18:00"),
    [room?.startTime, room?.endTime],
  );

  const rows = timeSlots.length;
  const displayCols = columns.length;

  // ── Filter by participant ──
  const [selectedName, setSelectedName] = useState<string>();

  const filteredParticipants = useMemo(
    () =>
      selectedName
        ? participants.filter((p) => p.name === selectedName)
        : participants,
    [participants, selectedName],
  );

  // ── Heatmap data ──
  const countMap = useMemo(() => {
    const map = new Map<string, number>();
    for (const p of filteredParticipants) {
      for (const slot of p.slots) {
        const key = `${slot.date}|${slot.time}`;
        map.set(key, (map.get(key) ?? 0) + 1);
      }
    }
    return map;
  }, [filteredParticipants]);

  const maxCount = selectedName ? 1 : participants.length;

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

  const renderGrid = useMemo(
    () => (countGrid.length > 0 ? buildRenderGrid2(countGrid) : []),
    [countGrid],
  );

  // ── Calendar bottom sheet ──
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const highlightedDates = useMemo(
    () => new Set(room?.dates ?? []),
    [room?.dates],
  );

  // 날짜별 참여자 수 (시간 무관)
  const dateCountMap = useMemo(() => {
    const map = new Map<string, Set<string>>();
    for (const p of filteredParticipants) {
      for (const slot of p.slots) {
        if (!map.has(slot.date)) {
          map.set(slot.date, new Set());
        }
        map.get(slot.date)?.add(p.name);
      }
    }
    const result = new Map<string, number>();
    for (const [date, names] of map) {
      result.set(date, names.size);
    }
    return result;
  }, [filteredParticipants]);

  const handleCalendarDateClick = useCallback(
    (dateKey: string) => {
      const targetIdx = weeks.findIndex((w) =>
        w.columns.some((col) => col.date === dateKey),
      );
      if (targetIdx !== -1) {
        setWeekIdx(targetIdx);
        setIsCalendarOpen(false);
      }
    },
    [weeks, setWeekIdx],
  );

  // ── Selection state ──
  const [selectionRect, setSelectionRect] = useState<Rect>();
  const [previewRect, setPreviewRect] = useState<Rect>();

  const startCell = useRef<Cell | undefined>(undefined);
  const currentRect = useRef<Rect>();

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

  const { onPointerDown, onPointerMove, onPointerUp, onPointerCancel, onLostPointerCapture } =
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
        <div className="flex items-center gap-2">
          <WeekNavigation onDateClick={() => setIsCalendarOpen(true)} />
          {/* Participant badges */}
          <div className="flex flex-1 flex-wrap items-center gap-1.5">
            {(activeRect ? participantCoverage : participants).map((p) => {
              const name = p.name;
              const isSelected = selectedName === name;
              return (
                <button
                  key={name}
                  type="button"
                  className="shrink-0 cursor-pointer px-6"
                  style={{
                    height: 44,
                    borderRadius: 999,
                    fontSize: 14,
                    fontWeight: isSelected ? 600 : 400,
                    backgroundColor: isSelected
                      ? adaptive.blue400
                      : adaptive.grey100,
                    color: isSelected ? "#fff" : adaptive.grey700,
                  }}
                  onClick={() =>
                    setSelectedName(isSelected ? undefined : name)
                  }
                >
                  {name}
                </button>
              );
            })}
          </div>
        </div>
        <div
          className="flex w-full"
          style={{ paddingLeft: TIME_WIDTH }}
        >
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
          onLostPointerCapture={onLostPointerCapture}
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

                const count = rc.center;
                const isHour = slot.endsWith(":00");
                const isFilled = count > 0;
                const cellBg = intensityColor(count, maxCount);

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

                    {/* Corner rendering */}
                    {CORNERS.map((pos) => {
                      const cornerCount = rc[pos];
                      if (cornerCount === count) return null;

                      const outerColor =
                        cornerCount < count
                          ? baseBg
                          : intensityColor(cornerCount, maxCount);
                      const innerColor =
                        cornerCount < count ? cellBg : baseBg;

                      return (
                        <div key={`corner-${pos}`}>
                          {/* Corner color band */}
                          <div
                            className="pointer-events-none"
                            style={{
                              ...cornerStyle(pos),
                              backgroundColor: outerColor,
                            }}
                          />
                          {/* Corner cut band */}
                          <div
                            className={cn(
                              "absolute pointer-events-none",
                              roundClass(pos),
                            )}
                            style={{
                              ...cornerStyle(pos),
                              backgroundColor: innerColor,
                            }}
                          />
                        </div>
                      );
                    })}

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

      {/* Heatmap Calendar BottomSheet */}
      <BottomSheet
        open={isCalendarOpen}
        onClose={() => setIsCalendarOpen(false)}
        header={<BottomSheet.Header>참여 현황</BottomSheet.Header>}
      >
        <HeatmapCalendarView
          highlightedDates={highlightedDates}
          dateCountMap={dateCountMap}
          maxCount={maxCount}
          onDateClick={handleCalendarDateClick}
        />
      </BottomSheet>
    </div>
  );
}
