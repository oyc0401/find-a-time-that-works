import React, { useCallback, useMemo, useRef, useState } from "react";
import { adaptive } from "@toss/tds-colors";
import { cn } from "@/lib/cn";
import { useDateSelectionStore } from "@/stores/useDateSelectionStore";

const TOTAL_CELLS = 35; // 5x7
const weekdays = ["일", "월", "화", "수", "목", "금", "토"];
const W = 7;
const H = 5;

// =====================
// Calendar Cells (meta)
// =====================

type Cell = {
  day: number;
  isCurrentMonth: boolean;
  hidden: boolean;
  isToday: boolean;
};

function useCalendarCells(): Cell[] {
  return useMemo(() => {
    const today = new Date();
    const year = today.getFullYear();
    const month = today.getMonth();
    const todayDate = today.getDate();

    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const allCells: Cell[] = [];

    // prev month placeholders
    const prevMonthDays = new Date(year, month, 0).getDate();
    for (let i = firstDay - 1; i >= 0; i--) {
      allCells.push({
        day: prevMonthDays - i,
        isCurrentMonth: false,
        hidden: true,
        isToday: false,
      });
    }

    // current month
    for (let d = 1; d <= daysInMonth; d++) {
      allCells.push({
        day: d,
        isCurrentMonth: true,
        hidden: d < todayDate,
        isToday: d === todayDate,
      });
    }

    // count fully hidden leading rows
    let hiddenRows = 0;
    for (let row = 0; row < H; row++) {
      const rowCells = allCells.slice(row * W, row * W + W);
      if (rowCells.length === W && rowCells.every((c) => c.hidden))
        hiddenRows++;
      else break;
    }

    const trimmed = allCells.slice(hiddenRows * W);

    // fill next month
    let nextDay = 1;
    while (trimmed.length < TOTAL_CELLS) {
      trimmed.push({
        day: nextDay++,
        isCurrentMonth: false,
        hidden: false,
        isToday: false,
      });
    }

    return trimmed.slice(0, TOTAL_CELLS);
  }, []);
}

// =====================
// Pure Render Model
// =====================

type Owner = "empty" | "preview" | "confirmed";

// RenderCell은 딱 이것만: 4코너 + {corner, center}
type RenderQuad = { corner: Owner; center: Owner };
type RenderCell = {
  lt: RenderQuad;
  rt: RenderQuad;
  lb: RenderQuad;
  rb: RenderQuad;
};
type RenderGrid = RenderCell[][];

const EMPTY_QUAD: RenderQuad = { corner: "empty", center: "empty" };
const EMPTY_CELL: RenderCell = {
  lt: EMPTY_QUAD,
  rt: EMPTY_QUAD,
  lb: EMPTY_QUAD,
  rb: EMPTY_QUAD,
};

type DragMode = "select" | "deselect";

function rowOf(i: number) {
  return (i / W) | 0;
}
function colOf(i: number) {
  return i % W;
}
function idxOf(r: number, c: number) {
  return r * W + c;
}

type Corners = { tl: boolean; tr: boolean; bl: boolean; br: boolean };

// “채워진 셀(ownerOn=true)”의 바깥 코너 판정
function outerCornersFor(
  on: boolean[],
  valid: boolean[],
  idx: number,
): Corners {
  if (!valid[idx] || !on[idx])
    return { tl: false, tr: false, bl: false, br: false };

  const r = rowOf(idx);
  const c = colOf(idx);

  const top = r > 0 && valid[idxOf(r - 1, c)] && on[idxOf(r - 1, c)];
  const bottom = r < H - 1 && valid[idxOf(r + 1, c)] && on[idxOf(r + 1, c)];
  const left = c > 0 && valid[idxOf(r, c - 1)] && on[idxOf(r, c - 1)];
  const right = c < W - 1 && valid[idxOf(r, c + 1)] && on[idxOf(r, c + 1)];

  return {
    tl: !top && !left,
    tr: !top && !right,
    bl: !bottom && !left,
    br: !bottom && !right,
  };
}

// “빈 셀(adjOn=false)”이지만 3칸이 차 있으면 concave 필요
function concaveCornersFor(
  adjOn: boolean[],
  valid: boolean[],
  idx: number,
): Corners {
  if (!valid[idx] || adjOn[idx])
    return { tl: false, tr: false, bl: false, br: false };

  const r = rowOf(idx);
  const c = colOf(idx);

  const up = r > 0 && valid[idxOf(r - 1, c)] && adjOn[idxOf(r - 1, c)];
  const down = r < H - 1 && valid[idxOf(r + 1, c)] && adjOn[idxOf(r + 1, c)];
  const left = c > 0 && valid[idxOf(r, c - 1)] && adjOn[idxOf(r, c - 1)];
  const right = c < W - 1 && valid[idxOf(r, c + 1)] && adjOn[idxOf(r, c + 1)];

  const ul =
    r > 0 && c > 0 && valid[idxOf(r - 1, c - 1)] && adjOn[idxOf(r - 1, c - 1)];
  const ur =
    r > 0 &&
    c < W - 1 &&
    valid[idxOf(r - 1, c + 1)] &&
    adjOn[idxOf(r - 1, c + 1)];
  const dl =
    r < H - 1 &&
    c > 0 &&
    valid[idxOf(r + 1, c - 1)] &&
    adjOn[idxOf(r + 1, c - 1)];
  const dr =
    r < H - 1 &&
    c < W - 1 &&
    valid[idxOf(r + 1, c + 1)] &&
    adjOn[idxOf(r + 1, c + 1)];

  return {
    tl: up && left && ul,
    tr: up && right && ur,
    bl: down && left && dl,
    br: down && right && dr,
  };
}

/**
 * 선생님 의도대로 corner 의미를 “결과 색”으로 사용:
 *
 * 1) center != empty 인 채워진 셀
 *    - outer corner(바깥 라운드가 필요한 코너)은 corner=empty 로 둔다.
 *      => view에서 (Color=baseBg → Cut=centerColor)로 “라운드한 흰색 코너”가 됨
 *    - 나머지 코너는 corner=center(=owner) 로 둔다. => 코너 작업 안 함
 *
 * 2) center == empty 인 빈 셀
 *    - concave가 필요한 코너는 corner=ownerColor(confirmed/preview) 로 둔다.
 *      => view에서 (Color=ownerColor → Cut=baseBg)로 오목 패치
 *    - 나머지는 corner=empty
 *
 * 3) deselect 드래그 “지워지는 프리뷰”
 *    - confirmedOn: selected에서 (dragMode=deselect && previewRect)에 걸린 셀은 confirmed에서 제외
 *    - ownerAt: confirmed > preview > empty
 */
function buildRenderGrid(args: {
  cells: Cell[];
  confirmed: Set<number>; // store selected
  preview: Set<number>; // drag rect
  dragMode: DragMode;
}): RenderGrid {
  const { cells, confirmed: selected, preview, dragMode } = args;
  const n = cells.length;

  const valid = new Array<boolean>(n);
  for (let i = 0; i < n; i++) valid[i] = !(cells[i]?.hidden ?? true);

  const isDragging = preview.size > 0;

  const confirmedOn = new Array<boolean>(n).fill(false);
  const previewAdjOn = new Array<boolean>(n).fill(false);
  const previewFillOn = new Array<boolean>(n).fill(false);

  for (let i = 0; i < n; i++) {
    if (!valid[i]) continue;

    const isSel = selected.has(i);
    const isPrev = preview.has(i);

    // confirmed truth (deselect 프리뷰에 걸린 확정은 잠시 confirmed에서 제외)
    confirmedOn[i] =
      isSel && !(isDragging && dragMode === "deselect" && isPrev);

    // adjacency truth (shape basis)
    previewAdjOn[i] = dragMode === "select" ? isSel || isPrev : isSel;

    // preview fill truth (dragging only)
    if (isDragging) {
      previewFillOn[i] = dragMode === "select" ? isSel || isPrev : isSel;
    }
  }

  const centerAt = new Array<Owner>(n).fill("empty");
  for (let i = 0; i < n; i++) {
    if (!valid[i]) continue;
    centerAt[i] = confirmedOn[i]
      ? "confirmed"
      : previewFillOn[i]
        ? "preview"
        : "empty";
  }

  // 코너 판정
  const confirmedOuter = new Array<Corners>(n);
  const previewOuter = new Array<Corners>(n);
  const confirmedConcave = new Array<Corners>(n);
  const previewConcave = new Array<Corners>(n);

  for (let i = 0; i < n; i++) {
    confirmedOuter[i] = outerCornersFor(confirmedOn, valid, i);
    previewOuter[i] = outerCornersFor(previewAdjOn, valid, i);
    confirmedConcave[i] = concaveCornersFor(confirmedOn, valid, i);
    previewConcave[i] = concaveCornersFor(previewAdjOn, valid, i);
  }

  const out1d: RenderCell[] = new Array(n);

  for (let i = 0; i < n; i++) {
    if (!valid[i]) {
      out1d[i] = EMPTY_CELL;
      continue;
    }

    const center = centerAt[i];

    // =====================
    // Filled cells: outer corners -> corner=empty (rounded white)
    // =====================
    if (center === "confirmed") {
      const oc = confirmedOuter[i];
      out1d[i] = {
        lt: { center, corner: oc.tl ? "empty" : "confirmed" },
        rt: { center, corner: oc.tr ? "empty" : "confirmed" },
        lb: { center, corner: oc.bl ? "empty" : "confirmed" },
        rb: { center, corner: oc.br ? "empty" : "confirmed" },
      };
      continue;
    }

    if (center === "preview") {
      const oc = previewOuter[i];
      out1d[i] = {
        lt: { center, corner: oc.tl ? "empty" : "preview" },
        rt: { center, corner: oc.tr ? "empty" : "preview" },
        lb: { center, corner: oc.bl ? "empty" : "preview" },
        rb: { center, corner: oc.br ? "empty" : "preview" },
      };
      continue;
    }

    // =====================
    // Empty cells: concave corners -> corner=ownerColor
    // priority: confirmed concave > preview concave
    // =====================
    const cc = confirmedConcave[i];
    const pc = previewConcave[i];

    out1d[i] = {
      lt: {
        center: "empty",
        corner: cc.tl ? "confirmed" : pc.tl ? "preview" : "empty",
      },
      rt: {
        center: "empty",
        corner: cc.tr ? "confirmed" : pc.tr ? "preview" : "empty",
      },
      lb: {
        center: "empty",
        corner: cc.bl ? "confirmed" : pc.bl ? "preview" : "empty",
      },
      rb: {
        center: "empty",
        corner: cc.br ? "confirmed" : pc.br ? "preview" : "empty",
      },
    };
  }

  const grid: RenderGrid = [];
  for (let r = 0; r < H; r++) {
    const row: RenderCell[] = [];
    for (let c = 0; c < W; c++) row.push(out1d[idxOf(r, c)]);
    grid.push(row);
  }
  return grid;
}

// =====================
// Drag Hook
// =====================

function getRectIndices(startIdx: number, endIdx: number): Set<number> {
  const sr = rowOf(startIdx);
  const sc = colOf(startIdx);
  const er = rowOf(endIdx);
  const ec = colOf(endIdx);

  const r0 = Math.min(sr, er);
  const r1 = Math.max(sr, er);
  const c0 = Math.min(sc, ec);
  const c1 = Math.max(sc, ec);

  const indices = new Set<number>();
  for (let r = r0; r <= r1; r++) {
    for (let c = c0; c <= c1; c++) indices.add(idxOf(r, c));
  }
  return indices;
}

function getCellIdxFromPoint(x: number, y: number): number | undefined {
  const el = document.elementFromPoint(x, y);
  if (!el) return undefined;
  const cellEl = el.closest("[data-cell-idx]");
  if (!cellEl) return undefined;
  const idx = Number(cellEl.getAttribute("data-cell-idx"));
  return Number.isNaN(idx) ? undefined : idx;
}

function useDateDragSelection(isHidden: (idx: number) => boolean) {
  const { selectedIndices, select, deselect } = useDateSelectionStore();

  const [previewIndices, setPreviewIndices] = useState<Set<number>>(new Set());
  const [dragMode, setDragMode] = useState<DragMode>("select");

  const dragStartIdx = useRef<number | undefined>(undefined);
  const isDraggingRef = useRef(false);

  const handlePointerDown = useCallback(
    (e: React.PointerEvent) => {
      const idx = getCellIdxFromPoint(e.clientX, e.clientY);
      if (idx === undefined || isHidden(idx)) return;

      isDraggingRef.current = true;
      dragStartIdx.current = idx;

      const mode: DragMode = selectedIndices.has(idx) ? "deselect" : "select";
      setDragMode(mode);

      setPreviewIndices(new Set([idx]));
      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    },
    [isHidden, selectedIndices],
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!isDraggingRef.current || dragStartIdx.current === undefined) return;

      const idx = getCellIdxFromPoint(e.clientX, e.clientY);
      if (idx === undefined || isHidden(idx)) return;

      setPreviewIndices(getRectIndices(dragStartIdx.current, idx));
    },
    [isHidden],
  );

  const handlePointerUp = useCallback(() => {
    isDraggingRef.current = false;
    dragStartIdx.current = undefined;

    setPreviewIndices((prev) => {
      if (prev.size > 0) {
        if (dragMode === "select") select(prev);
        else deselect(prev);
      }
      return new Set();
    });
  }, [dragMode, select, deselect]);

  return {
    selectedIndices,
    previewIndices,
    dragMode,
    handlePointerDown,
    handlePointerMove,
    handlePointerUp,
  };
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
 * 선생님 규칙 기반 코너 렌더 조건:
 * - center != empty && corner == empty  => OUTER rounding cut (white rounded corner)
 * - center == empty && corner != empty  => CONCAVE patch (colored corner)
 */
function needsCornerOp(center: Owner, corner: Owner) {
  if (center !== "empty") return corner === "empty";
  return corner !== "empty";
}

export default function DateSelector() {
  const cells = useCalendarCells();

  const {
    selectedIndices,
    previewIndices,
    dragMode,
    handlePointerDown,
    handlePointerMove,
    handlePointerUp,
  } = useDateDragSelection((idx) => cells[idx]?.hidden ?? true);

  const renderGrid = useMemo(
    () =>
      buildRenderGrid({
        cells,
        confirmed: selectedIndices,
        preview: previewIndices,
        dragMode,
      }),
    [cells, selectedIndices, previewIndices, dragMode],
  );

  const baseBg = "white";
  const ringColor = adaptive.blue300;

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
        style={{ touchAction: "none" }}
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
                // - filled & corner empty => baseBg (white)
                // - empty & corner colored => corner color (owner color)
                const outerColor =
                  center !== "empty" ? baseBg : ownerBg(corner, dragMode);

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
                // - filled & corner empty => centerColor (to make rounded “inside blue”)
                // - empty & corner colored => baseBg (to carve concave)
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
