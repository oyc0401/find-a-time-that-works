import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import { adaptive } from "@toss/tds-colors";
import Badge from "@/components/Badge";
import { cn } from "@/lib/cn";
import { generateTimeSlots } from "@/lib/timeSlots";
import { buildRenderGrid2 } from "@/lib/renderGrid2";
import { useRoomData } from "@/hooks/useRoomData";
import { useRoomStore } from "@/stores/useRoomStore";
import { heatColor } from "@/lib/heatColor";
import { useLongPressDrag } from "@/hooks/useLongPressDrag";
import CalendarHeader from "./CalendarHeader";
import { useTranslation } from "react-i18next";
import { getUserId } from "@/repository/userId";
import {
  type Cell,
  CORNERS,
  CELL_H,
  TIME_WIDTH,
  CELL_W,
  getCellFromPoint,
  isSameCell,
  cornerStyle,
  roundClass,
} from "@/lib/gridUtils";
import OverviewCalendarSheet from "./bottomSheet/OverviewCalendarSheet";
import WeekNavigation from "./WeekNavigation";
import { Border } from "@toss/tds-mobile";

type Rect = { r0: number; r1: number; dc0: number; dc1: number };

function intensityColor(count: number, max: number): string {
  if (count === 0 || max === 0) return "transparent";
  return heatColor(count / max);
}

export default function OverviewTap() {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const { room, participants, columns } = useRoomData(id);
  const selectedUserIds = useRoomStore((state) => state.selectedUserIds);
  const setSelectedUserIds = useRoomStore((state) => state.setSelectedUserIds);

  const timeSlots = useMemo(
    () =>
      generateTimeSlots(room?.startTime ?? "09:00", room?.endTime ?? "18:00"),
    [room?.startTime, room?.endTime],
  );

  const rows = timeSlots.length;
  const displayCols = columns.length;

  // ── Current user ID ──
  const [myUserId, setMyUserId] = useState<string>();
  useEffect(() => {
    getUserId().then(setMyUserId);
  }, []);

  // ── Filter by participant ──
  const filteredParticipants = useMemo(
    () =>
      selectedUserIds.length > 0
        ? participants.filter((p) => selectedUserIds.includes(p.userId))
        : participants,
    [participants, selectedUserIds],
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

  const maxCount = useMemo(() => {
    let max = 1;
    for (const row of countGrid) {
      for (const val of row) {
        if (val > max) max = val;
      }
    }
    return max;
  }, [countGrid]);

  const renderGrid = useMemo(
    () => (countGrid.length > 0 ? buildRenderGrid2(countGrid) : []),
    [countGrid],
  );

  const setIsOverviewCalendarOpen = useRoomStore(
    (state) => state.setIsOverviewCalendarOpen,
  );

  // ── Selection state ──
  const [selectionRect, setSelectionRect] = useState<Rect>();
  const [previewRect, setPreviewRect] = useState<Rect>();

  const startCell = useRef<Cell | undefined>(undefined);
  const currentRect = useRef<Rect>();

  // ── Grid drag handlers ──
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
    setSelectionRect((prev) => {
      if (
        prev &&
        prev.r0 === cell.row &&
        prev.r1 === cell.row &&
        prev.dc0 === cell.col &&
        prev.dc1 === cell.col
      ) {
        return undefined;
      }
      return {
        r0: cell.row,
        r1: cell.row,
        dc0: cell.col,
        dc1: cell.col,
      };
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

  const {
    onPointerDown,
    onPointerMove,
    onPointerUp,
    onPointerCancel,
    onLostPointerCapture,
  } = useLongPressDrag({
    getCellFromPoint,
    isSameCell,
    onLongPressStart: handleLongPressStart,
    onDrag: handleDrag,
    onTap: handleTap,
    onEnd: handleEnd,
  });

  // ── Header selection helpers (single / range) ──
  const selectHeaderCols = useCallback(
    (colA: number, colB: number) => {
      if (rows <= 0 || displayCols <= 0) return;

      const dc0 = Math.max(0, Math.min(colA, colB));
      const dc1 = Math.min(displayCols - 1, Math.max(colA, colB));

      startCell.current = undefined;
      currentRect.current = undefined;

      setPreviewRect(undefined);
      setSelectionRect({
        r0: 0,
        r1: rows - 1,
        dc0,
        dc1,
      });
    },
    [rows, displayCols],
  );

  const previewHeaderCols = useCallback(
    (colA: number, colB: number) => {
      if (rows <= 0 || displayCols <= 0) return;

      const dc0 = Math.max(0, Math.min(colA, colB));
      const dc1 = Math.min(displayCols - 1, Math.max(colA, colB));

      startCell.current = undefined;
      currentRect.current = undefined;

      setSelectionRect(undefined);
      setPreviewRect({
        r0: 0,
        r1: rows - 1,
        dc0,
        dc1,
      });
    },
    [rows, displayCols],
  );

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
        return {
          name: p.name,
          userId: p.userId,
          covered,
          total: selectedSlots.length,
        };
      })
      .filter((p) => p.covered > 0)
      .sort((a, b) => b.covered - a.covered);
  }, [selectedSlots, participants]);

  // 드래그 범위 내 참가자 userId Set
  const coverageUserIdSet = useMemo(
    () => new Set(participantCoverage.map((p) => p.userId)),
    [participantCoverage],
  );

  const baseBg = "white";

  const overlayRect = previewRect ?? selectionRect;

  const allSelectedCols = useMemo<boolean[]>(() => {
    const result = Array.from({ length: displayCols }, () => false);

    if (!overlayRect) return result;

    const isFullRowSelection =
      rows > 0 && overlayRect.r0 === 0 && overlayRect.r1 === rows - 1;

    if (!isFullRowSelection) return result;

    for (let c = overlayRect.dc0; c <= overlayRect.dc1; c++) {
      if (c >= 0 && c < displayCols) result[c] = true;
    }

    return result;
  }, [overlayRect, displayCols, rows]);


  return (
    <div className="w-full pb-32">
     
      <div className="bg-white px-4 pt-4">
        {/* Participant badges */}
        <div className="flex flex-wrap items-center gap-1.5">
          <Badge
            title={t("overview.all")}
            color={selectedUserIds.length === 0 ? adaptive.blue400 : adaptive.grey100}
            textColor={selectedUserIds.length === 0 ? "white" : adaptive.grey600}
            className="shrink-0"
            onClick={() => {
              setSelectedUserIds([]);
            }}
          />
          {[...participants]
            .sort((a, b) => {
              const aIsMe = a.userId === myUserId;
              const bIsMe = b.userId === myUserId;
              if (aIsMe && !bIsMe) return -1;
              if (!aIsMe && bIsMe) return 1;
              return 0;
            })
            .map((p) => {
              const isSelected = selectedUserIds.includes(p.userId);
              const inRange = activeRect !== undefined && coverageUserIdSet.has(p.userId);
              return (
                <Badge
                  key={p.userId}
                  title={p.name}
                  color={isSelected ? adaptive.blue400 : adaptive.grey100}
                  textColor={isSelected ? "white" : adaptive.grey600}
                  borderColor={inRange ? adaptive.blue400 : undefined}
                  className="shrink-0"
                  onClick={() => {
                    setSelectedUserIds(
                      isSelected
                        ? selectedUserIds.filter((id) => id !== p.userId)
                        : [...selectedUserIds, p.userId],
                    );
                  }}
                />
              );
            })}
        </div>

      </div>
<div className="py-4">
<Border variant="height16" />
</div>


      {/* Grid body */}
      <div className="pl-4 flex flex-row">
        {/* Time labels */}
        <div className="shrink-0 pt-7" style={{ width: TIME_WIDTH }}>
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
          {/* End time label */}
          <div className="relative" style={{ height: 0 }}>
            <span
              className="absolute right-1.5"
              style={{
                top: -8,
                fontSize: 12,
                lineHeight: "16px",
                color: adaptive.grey500,
              }}
            >
              {Number.parseInt(room?.endTime?.split(":")[0] ?? "18")}
            </span>
          </div>
        </div>

        {/* Cells */}
        <div className="overflow-x-auto">
          <div className="w-max pr-4">
            <CalendarHeader
              columns={columns}
              allSelectedCols={allSelectedCols}
              onTap={(col) => selectHeaderCols(col, col)}
              onSelect={(dc0, dc1) => selectHeaderCols(dc0, dc1)}
              onPreview={(dc0, dc1) => previewHeaderCols(dc0, dc1)}
              onCancelPreview={() => setPreviewRect(undefined)}
            />
          <div
            className="mt-2 relative flex w-max"
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerCancel={onPointerCancel}
            onLostPointerCapture={onLostPointerCapture}
          >
            {columns.map((col, displayIdx) => (
              <div
                key={col.date}
                className="flex flex-col flex-none"
                style={{ width: CELL_W }}
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
                        rowIdx === timeSlots.length - 1 && "border-b border-gray-300",
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
                        const innerColor = cornerCount < count ? cellBg : baseBg;

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
                  left: overlayRect.dc0 * CELL_W,
                  width: (overlayRect.dc1 - overlayRect.dc0 + 1) * CELL_W,
                  backgroundColor: "#c9e2ff60",
                  border: "2px solid #3182f6",
                }}
              />
            )}
          </div>
          </div>
        </div>
      </div>

      <OverviewCalendarSheet />
    </div>
  );
}
