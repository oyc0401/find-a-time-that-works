import { useMemo } from "react";
import { useParams } from "react-router-dom";
import { adaptive } from "@toss/tds-colors";
import { cn } from "@/lib/cn";
import { generateTimeSlots, formatDateHeader } from "@/lib/timeSlots";
import {
  type RenderCell,
  buildRenderGrid,
} from "@/lib/renderGrid";
import { useRoomData } from "@/hooks/useRoomData";
import { useRoomStore } from "@/stores/useRoomStore";
import { heatColor } from "@/lib/heatColor";
import WeekNavigation from "./WeekNavigation";

const CELL_H = 20;
const CORNER_SIZE = 4;
const TIME_WIDTH = 16;

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

function intensityColor(count: number, max: number): string {
  if (count === 0 || max === 0) return "transparent";
  return heatColor(count / max);
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

  // count 그리드 (display 기준)
  const countGrid = useMemo(() => {
    const result: number[][] = [];
    for (let r = 0; r < rows; r++) {
      result[r] = [];
      for (let dc = 0; dc < displayCols; dc++) {
        const date = columns[dc]?.date;
        const slot = timeSlots[r];
        result[r][dc] = date && slot ? (countMap.get(`${date}|${slot}`) ?? 0) : 0;
      }
    }
    return result;
  }, [rows, displayCols, columns, timeSlots, countMap]);

  // 라운드 코너용: filled 여부를 confirmed로 취급
  const filledGrid = useMemo(
    () => countGrid.map((row) => row.map((c) => c > 0)),
    [countGrid],
  );

  const emptyPreview = useMemo(
    () => Array.from({ length: rows }, () => Array(displayCols).fill(false) as boolean[]),
    [rows, displayCols],
  );

  const renderGrid = useMemo(
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

  const dateHeaders = columns.map((col) => formatDateHeader(col.date));
  const baseBg = "white";

  return (
    <div className="w-full">
      <div className="bg-white px-4">
        <WeekNavigation />
        {/* Date headers */}
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
        <div className="flex flex-1">
          {columns.map((col, displayIdx) => (
            <div
              key={col.date}
              className="flex flex-1 flex-col"
              style={{ minWidth: 44 }}
            >
              {timeSlots.map((slot, rowIdx) => {
                const rc: RenderCell | undefined = renderGrid[rowIdx]?.[displayIdx];
                if (!rc) return null;

                const count = countGrid[rowIdx]?.[displayIdx] ?? 0;
                const isHour = slot.endsWith(":00");
                const isFilled = count > 0;
                const cellBg = intensityColor(count, maxCount);

                // 코너 판정: center가 confirmed = filled
                const centerOwner = rc.lt.center;

                return (
                  <div
                    key={slot}
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
                      const corner =
                        pos === "lt"
                          ? rc.lt.corner
                          : pos === "rt"
                            ? rc.rt.corner
                            : pos === "lb"
                              ? rc.lb.corner
                              : rc.rb.corner;

                      // 코너 렌더 필요 여부
                      if (centerOwner !== "empty") {
                        if (corner === centerOwner) return null;
                      } else {
                        if (corner === "empty") return null;
                      }

                      // 이웃 셀의 intensity color 계산
                      const neighborColor = (() => {
                        if (centerOwner !== "empty" && corner === "empty") return baseBg;
                        if (centerOwner !== "empty") return cellBg; // shouldn't happen for overview
                        // center empty, corner filled → 이웃 셀 색상 필요
                        // 이웃 셀의 count를 가져와서 색상 결정
                        const nr =
                          pos === "lt" || pos === "rt" ? rowIdx - 1 :
                          pos === "lb" || pos === "rb" ? rowIdx + 1 : rowIdx;
                        const nc =
                          pos === "lt" || pos === "lb" ? displayIdx - 1 :
                          pos === "rt" || pos === "rb" ? displayIdx + 1 : displayIdx;
                        const nCount = countGrid[nr]?.[nc] ?? 0;
                        return intensityColor(nCount, maxCount);
                      })();

                      return (
                        <div
                          key={`corner-color-${pos}`}
                          className="pointer-events-none"
                          style={{
                            ...cornerStyle(pos),
                            backgroundColor: neighborColor,
                          }}
                        />
                      );
                    })}

                    {/* Corner cut band */}
                    {CORNERS.map((pos) => {
                      const corner =
                        pos === "lt"
                          ? rc.lt.corner
                          : pos === "rt"
                            ? rc.rt.corner
                            : pos === "lb"
                              ? rc.lb.corner
                              : rc.rb.corner;

                      if (centerOwner !== "empty") {
                        if (corner === centerOwner) return null;
                      } else {
                        if (corner === "empty") return null;
                      }

                      const innerColor = centerOwner !== "empty" ? cellBg : baseBg;

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
    </div>
  );
}
