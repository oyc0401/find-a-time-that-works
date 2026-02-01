import { useMemo } from "react";
import { adaptive } from "@toss/tds-colors";
import { cn } from "@/lib/cn";
import { generateTimeSlots, formatDateHeader } from "@/lib/timeSlots";
import { useRoomStore } from "@/stores/useRoomStore";
import WeekNavigation from "./WeekNavigation";

const CELL_H = 24;

function intensityColor(count: number, max: number): string {
  if (count === 0 || max === 0) return "transparent";
  const ratio = count / max;
  if (ratio <= 0.25) return adaptive.blue100;
  if (ratio <= 0.5) return adaptive.blue200;
  if (ratio <= 0.75) return adaptive.blue300;
  return adaptive.blue400;
}

export default function OverviewGrid() {
  const { room, participants, weeks, weekIdx } = useRoomStore();
  const columns = weeks[weekIdx]?.columns ?? [];

  const timeSlots = useMemo(
    () => generateTimeSlots(room?.startTime ?? "09:00", room?.endTime ?? "18:00"),
    [room?.startTime, room?.endTime],
  );

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
  const dateHeaders = columns.map((col) => formatDateHeader(col.date));

  return (
    <div className="w-full overflow-x-auto px-4 py-3">
      <WeekNavigation />

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
        <div className="shrink-0" style={{ width: 28 }}>
          {timeSlots.map((slot) => {
            const isHour = slot.endsWith(":00");
            const hour = Number.parseInt(slot.split(":")[0]);
            return (
              <div
                key={slot}
                className="relative"
                style={{ height: CELL_H }}
              >
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
                const count = countMap.get(`${col.date}|${slot}`) ?? 0;
                const isHour = slot.endsWith(":00");

                return (
                  <div
                    key={slot}
                    className={cn(
                      "relative border-r border-gray-200",
                      isHour
                        ? "border-t border-gray-300"
                        : "border-t border-dashed border-gray-200",
                      displayIdx === 0 && "border-l border-gray-200",
                      rowIdx === timeSlots.length - 1 &&
                        "border-b border-gray-300",
                    )}
                    style={{
                      height: CELL_H,
                      backgroundColor: intensityColor(count, maxCount),
                    }}
                  >
                    {count > 0 && (
                      <span
                        className="absolute inset-0 flex items-center justify-center"
                        style={{
                          fontSize: 10,
                          color: count / maxCount > 0.5 ? "#fff" : adaptive.grey600,
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
          className="mt-3 flex items-center justify-end gap-2"
          style={{ fontSize: 11, color: adaptive.grey500 }}
        >
          <span>0/{maxCount}</span>
          <div className="flex gap-0.5">
            {[adaptive.blue100, adaptive.blue200, adaptive.blue300, adaptive.blue400].map(
              (color) => (
                <div
                  key={color}
                  className="rounded-sm"
                  style={{ width: 12, height: 12, backgroundColor: color }}
                />
              ),
            )}
          </div>
          <span>{maxCount}/{maxCount}</span>
        </div>
      )}
    </div>
  );
}
