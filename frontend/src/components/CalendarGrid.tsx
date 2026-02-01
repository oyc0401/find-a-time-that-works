import { useMemo } from "react";
import { adaptive } from "@toss/tds-colors";
import { cn } from "@/lib/cn";
import { buildCalendarCells } from "@/lib/calendar";
import type { Owner, RenderCell } from "@/lib/renderDragGrid";

const weekdays = ["일", "월", "화", "수", "목", "금", "토"];
const W = 7;

function toDateKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function rowOf(i: number) {
  return (i / W) | 0;
}
function colOf(i: number) {
  return i % W;
}

// ── 5-band zIndex ──

const Z = {
  TODAY: 10,
  CENTER: 20,
  CORNER_COLOR: 30,
  CORNER_CUT: 40,
  TEXT: 50,
} as const;

type CornerPos = "lt" | "rt" | "lb" | "rb";
const CORNERS: CornerPos[] = ["lt", "rt", "lb", "rb"];

function cornerStyle(pos: CornerPos): React.CSSProperties {
  const s: React.CSSProperties = {
    position: "absolute",
    width: 8,
    height: 8,
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
  if (pos === "lt") return "rounded-tl-lg";
  if (pos === "rt") return "rounded-tr-lg";
  if (pos === "lb") return "rounded-bl-lg";
  return "rounded-br-lg";
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

// ── Component ──

interface PointerHandlers {
  onPointerDown: React.PointerEventHandler;
  onPointerMove: React.PointerEventHandler;
  onPointerUp: React.PointerEventHandler;
  onPointerCancel: React.PointerEventHandler;
}

interface CalendarGridProps {
  renderGrid: RenderCell[][];
  pointerHandlers?: PointerHandlers;
  colorOf: (
    owner: Owner,
    dateKey?: string,
  ) => { bg: string; whiteText: boolean; text?: string };
  onCellClick?: (cellIdx: number) => void;
  onCellPressStart?: (cellIdx: number) => void;
  onCellPressEnd?: () => void;
}

export default function CalendarGrid({
  renderGrid,
  pointerHandlers,
  colorOf,
  onCellClick,
  onCellPressStart,
  onCellPressEnd,
}: CalendarGridProps) {
  const cells = useMemo(() => buildCalendarCells(), []);

  const today = new Date();
  const currentMonth = today.getMonth();
  const baseBg = "white";

  return (
    <div className="w-full px-5 py-4">
      <div className="grid grid-cols-7 text-center">
        {weekdays.map((d) => (
          <span
            key={d}
            style={{
              fontSize: 15,
              lineHeight: "22.5px",
              color: adaptive.grey500,
            }}
          >
            {d}
          </span>
        ))}
      </div>

      <div className="mt-3 grid grid-cols-7" {...pointerHandlers}>
        {cells.map((cell, idx) => {
          const rc = renderGrid[rowOf(idx)][colOf(idx)];
          const valid = !(cell.hidden ?? true);
          const isCurrentMonth = cell.date.getMonth() === currentMonth;
          const isToday = cell.isToday;
          const dateKey = toDateKey(cell.date);

          const center = centerOwner(rc);
          const {
            bg: centerBg,
            whiteText,
            text: customText,
          } = colorOf(center, dateKey);
          const filled = center !== "empty";

          let textColor: string;
          if (whiteText) textColor = "#ffffff";
          else textColor = isCurrentMonth ? adaptive.grey800 : adaptive.grey400;

          return (
            <div
              key={idx}
              data-cell-idx={idx}
              className={cn(
                "relative select-none flex items-center justify-center w-full aspect-square",
                !valid && "opacity-0 pointer-events-none",
                onCellClick && "cursor-pointer",
              )}
              onClick={onCellClick ? () => onCellClick(idx) : undefined}
              onPointerDown={
                onCellPressStart ? () => onCellPressStart(idx) : undefined
              }
              onPointerUp={onCellPressEnd}
              onPointerLeave={onCellPressEnd}
            >
              {/* Today ring */}
              {isToday && !filled && (
                <div
                  className="absolute rounded-full pointer-events-none"
                  style={{
                    zIndex: Z.TODAY,
                    width: 42,
                    height: 42,
                    border: `2px solid ${adaptive.blue400}`,
                  }}
                />
              )}

              {/* Center fill */}
              {filled && (
                <div
                  className="absolute inset-0 pointer-events-none"
                  style={{ zIndex: Z.CENTER, backgroundColor: centerBg }}
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
                      : colorOf(corner).bg
                    : colorOf(corner).bg;
                return (
                  <div
                    key={`cc-${pos}`}
                    className="pointer-events-none"
                    style={{
                      ...cornerStyle(pos),
                      zIndex: Z.CORNER_COLOR,
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
                    key={`ct-${pos}`}
                    className={cn(
                      "absolute pointer-events-none w-2 h-2",
                      roundClass(pos),
                    )}
                    style={{
                      ...cornerStyle(pos),
                      zIndex: Z.CORNER_CUT,
                      backgroundColor: innerColor,
                    }}
                  />
                );
              })}

              {/* Text */}
              <span
                className="relative"
                style={{
                  zIndex: Z.TEXT,
                  fontSize: 20,
                  lineHeight: "29px",
                  color: textColor,
                }}
              >
                {customText ?? cell.day}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
