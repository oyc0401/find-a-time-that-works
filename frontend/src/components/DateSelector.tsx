import { useMemo } from "react";
import { adaptive } from "@toss/tds-colors";
import { cn } from "@/lib/cn";
import { buildCalendarCells } from "@/lib/calendar";
import {
  type Owner,
  type RenderCell,
  type DragMode,
  buildRenderGrid,
} from "./DateSelector.logic";
import { rowOf, colOf, useDateDragSelection } from "./DateSelector.drag";

const weekdays = ["일", "월", "화", "수", "목", "금", "토"];

// =====================
// View: 5-band zIndex
// Today ring (bottom) -> Center Fill -> Corner Color -> Corner Cut -> Text (top)
// =====================

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

function ownerBg(owner: Owner, dragMode: DragMode) {
  if (owner === "confirmed") return adaptive.blue300;
  if (owner === "preview")
    return dragMode === "select" ? adaptive.blue200 : adaptive.blue50;
  return "transparent";
}

/**
 * 코너 렌더 조건:
 * - center != empty && corner != center => 코너 작업 필요 (empty면 라운딩, preview면 preview 색)
 * - center == empty && corner != empty  => CONCAVE patch (colored corner)
 */
function needsCornerOp(center: Owner, corner: Owner) {
  if (center !== "empty") return corner !== center;
  return corner !== "empty";
}

export default function DateSelector() {
  const cells = useMemo(() => buildCalendarCells(), []);

  const {
    confirmed,
    preview,
    dragMode,
    handlePointerDown,
    handlePointerMove,
    handlePointerUp,
  } = useDateDragSelection((idx) => cells[idx]?.hidden ?? true);

  const renderGrid = useMemo(
    () => buildRenderGrid({ confirmed, preview, dragMode }),
    [confirmed, preview, dragMode],
  );

  const baseBg = "white";
  const ringColor = adaptive.blue400;

  return (
    <div className="w-full px-5 py-4">
      {/* weekday header */}
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

      {/* grid */}
      <div
        className="mt-3 grid grid-cols-7"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
      >
        {cells.map((cell, idx) => {
          const rc = renderGrid[rowOf(idx)][colOf(idx)];
          const valid = !(cell.hidden ?? true);

          const center = centerOwner(rc);
          const centerBg = ownerBg(center, dragMode);

          let textColor: string;
          if (center === "confirmed") textColor = "#ffffff";
          else if (center === "preview" && dragMode === "select")
            textColor = "#ffffff";
          else
            textColor = cell.isCurrentMonth
              ? adaptive.grey800
              : adaptive.grey400;

          return (
            <div
              key={idx}
              data-cell-idx={idx}
              className={cn(
                "relative select-none flex items-center justify-center w-full aspect-square",
                !valid && "opacity-0 pointer-events-none",
              )}
            >
              {/* 0) Today ring (bottom) */}
              {cell.isToday && center === "empty" && (
                <div
                  className="absolute rounded-full pointer-events-none"
                  style={{
                    zIndex: Z.TODAY,
                    width: 42,
                    height: 42,
                    border: `2px solid ${ringColor}`,
                  }}
                />
              )}

              {/* 1) Center fill (no rounded) */}
              {center !== "empty" && (
                <div
                  className="absolute inset-0 pointer-events-none"
                  style={{
                    zIndex: Z.CENTER,
                    backgroundColor: centerBg,
                  }}
                />
              )}

              {/* 2) Corner Color band */}
              {CORNERS.map((pos) => {
                const corner = cornerOwner(rc, pos);
                if (!needsCornerOp(center, corner)) return null;

                // outerColor:
                // - filled & corner empty => baseBg (white, 라운딩)
                // - filled & corner preview => preview color
                // - empty & corner colored => corner color (owner color)
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
                      zIndex: Z.CORNER_COLOR,
                      backgroundColor: outerColor,
                    }}
                  />
                );
              })}

              {/* 3) Corner Cut band */}
              {CORNERS.map((pos) => {
                const corner = cornerOwner(rc, pos);
                if (!needsCornerOp(center, corner)) return null;

                // innerColor:
                // - filled & corner empty => centerColor (라운딩된 안쪽)
                // - filled & corner preview => centerColor (preview 위에 center 라운딩)
                // - empty & corner colored => baseBg (오목 패치)
                const innerColor = center !== "empty" ? centerBg : baseBg;

                return (
                  <div
                    key={`corner-cut-${pos}`}
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

              {/* 4) Text (top) */}
              <span
                className="relative"
                style={{
                  zIndex: Z.TEXT,
                  fontSize: 20,
                  lineHeight: "29px",
                  color: textColor,
                }}
              >
                {cell.day}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
