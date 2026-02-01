import { useCallback, useMemo, useRef, useState } from "react";
import { adaptive } from "@toss/tds-colors";
import { cn } from "@/lib/cn";
import { buildCalendarCells } from "@/lib/calendar";
import {
  type Rect,
  useDateSelectionStore,
} from "@/stores/useDateSelectionStore";
import { useLongPressDrag } from "@/hooks/useLongPressDrag";
import {
  type Owner,
  type RenderCell,
  type DragMode,
  buildRenderGrid,
} from "@/lib/renderGrid";

const weekdays = ["일", "월", "화", "수", "목", "금", "토"];

// =====================
// Grid constants
// =====================

const W = 7;
const H = 5;

function createEmptyPreview(): boolean[][] {
  return Array.from({ length: H }, () => Array(W).fill(false));
}

function rowOf(i: number) {
  return (i / W) | 0;
}

function colOf(i: number) {
  return i % W;
}

function getRect(startIdx: number, endIdx: number): Rect {
  const sr = rowOf(startIdx);
  const sc = colOf(startIdx);
  const er = rowOf(endIdx);
  const ec = colOf(endIdx);

  return {
    r0: Math.min(sr, er),
    r1: Math.max(sr, er),
    c0: Math.min(sc, ec),
    c1: Math.max(sc, ec),
  };
}

function applyRect(
  grid: boolean[][],
  rect: Rect,
  value: boolean,
): boolean[][] {
  const next = grid.map((row) => [...row]);
  for (let r = rect.r0; r <= rect.r1; r++) {
    for (let c = rect.c0; c <= rect.c1; c++) {
      next[r][c] = value;
    }
  }
  return next;
}

function getCellIdxFromPoint(x: number, y: number): number | undefined {
  const el = document.elementFromPoint(x, y);
  if (!el) return undefined;
  const cellEl = el.closest("[data-cell-idx]");
  if (!cellEl) return undefined;
  const idx = Number(cellEl.getAttribute("data-cell-idx"));
  return Number.isNaN(idx) ? undefined : idx;
}

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

function useDateDragSelection(isHidden: (idx: number) => boolean) {
  const { confirmed, select, deselect } = useDateSelectionStore();

  const [preview, setPreview] = useState<boolean[][]>(createEmptyPreview);
  const [dragMode, setDragMode] = useState<DragMode>("select");

  const dragStartIdx = useRef<number | undefined>(undefined);
  const currentRect = useRef<Rect | undefined>(undefined);

  const getCellFromPoint = useCallback(
    (x: number, y: number) => {
      const idx = getCellIdxFromPoint(x, y);
      if (idx === undefined || isHidden(idx)) return undefined;
      return idx;
    },
    [isHidden],
  );

  const handleLongPressStart = useCallback(
    (idx: number) => {
      dragStartIdx.current = idx;

      const r = rowOf(idx);
      const c = colOf(idx);
      const mode: DragMode = confirmed[r][c] ? "deselect" : "select";
      setDragMode(mode);

      const rect = getRect(idx, idx);
      currentRect.current = rect;
      setPreview(applyRect(createEmptyPreview(), rect, true));
    },
    [confirmed],
  );

  const handleDrag = useCallback((idx: number) => {
    if (dragStartIdx.current === undefined) return;

    const rect = getRect(dragStartIdx.current, idx);
    currentRect.current = rect;
    setPreview(applyRect(createEmptyPreview(), rect, true));
  }, []);

  const handleTap = useCallback(
    (idx: number) => {
      const r = rowOf(idx);
      const c = colOf(idx);
      const mode: DragMode = confirmed[r][c] ? "deselect" : "select";
      const rect = getRect(idx, idx);

      if (mode === "select") select(rect);
      else deselect(rect);
    },
    [confirmed, select, deselect],
  );

  const handleEnd = useCallback(() => {
    const rect = currentRect.current;
    if (rect) {
      if (dragMode === "select") select(rect);
      else deselect(rect);
    }

    dragStartIdx.current = undefined;
    currentRect.current = undefined;
    setPreview(createEmptyPreview());
  }, [dragMode, select, deselect]);

  const { onPointerDown, onPointerMove, onPointerUp } = useLongPressDrag({
    getCellFromPoint,
    onLongPressStart: handleLongPressStart,
    onDrag: handleDrag,
    onTap: handleTap,
    onEnd: handleEnd,
  });

  return {
    confirmed,
    preview,
    dragMode,
    handlePointerDown: onPointerDown,
    handlePointerMove: onPointerMove,
    handlePointerUp: onPointerUp,
  };
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
