import React, { useCallback, useMemo, useRef, useState } from "react";
import { adaptive } from "@toss/tds-colors";
import { cn } from "@/lib/cn";
import { useDateSelectionStore } from "@/stores/useDateSelectionStore";

const TOTAL_CELLS = 35; // 5줄 × 7칸
const weekdays = ["일", "월", "화", "수", "목", "금", "토"];
const W = 7;

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

    const firstDay = new Date(year, month, 1).getDay(); // 이번달 1일의 요일
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const allCells: Cell[] = [];

    // 이번달 1일 이전 빈칸 (이전달)
    const prevMonthDays = new Date(year, month, 0).getDate();
    for (let i = firstDay - 1; i >= 0; i--) {
      allCells.push({
        day: prevMonthDays - i,
        isCurrentMonth: false,
        hidden: true,
        isToday: false,
      });
    }

    // 이번달 날짜
    for (let d = 1; d <= daysInMonth; d++) {
      allCells.push({
        day: d,
        isCurrentMonth: true,
        hidden: d < todayDate,
        isToday: d === todayDate,
      });
    }

    // 앞쪽에서 완전히 hidden인 줄(7칸) 수 계산
    let hiddenRows = 0;
    for (let row = 0; row < 5; row++) {
      const rowCells = allCells.slice(row * 7, row * 7 + 7);
      if (rowCells.length === 7 && rowCells.every((c) => c.hidden)) {
        hiddenRows++;
      } else {
        break;
      }
    }

    // hidden된 줄 제거
    const trimmed = allCells.slice(hiddenRows * 7);

    // 다음달 날짜로 TOTAL_CELLS까지 채움
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

// --- 드래그 선택 훅 ---

type DragMode = "select" | "deselect";

function getRectIndices(startIdx: number, endIdx: number): Set<number> {
  const startRow = Math.floor(startIdx / 7);
  const startCol = startIdx % 7;
  const endRow = Math.floor(endIdx / 7);
  const endCol = endIdx % 7;

  const minRow = Math.min(startRow, endRow);
  const maxRow = Math.max(startRow, endRow);
  const minCol = Math.min(startCol, endCol);
  const maxCol = Math.max(startCol, endCol);

  const indices = new Set<number>();
  for (let r = minRow; r <= maxRow; r++) {
    for (let c = minCol; c <= maxCol; c++) {
      indices.add(r * 7 + c);
    }
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
  const isDragging = useRef(false);

  const handlePointerDown = useCallback(
    (e: React.PointerEvent) => {
      const idx = getCellIdxFromPoint(e.clientX, e.clientY);
      if (idx === undefined || isHidden(idx)) return;

      isDragging.current = true;
      dragStartIdx.current = idx;

      const mode = selectedIndices.has(idx) ? "deselect" : "select";
      setDragMode(mode);
      setPreviewIndices(new Set([idx]));

      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    },
    [selectedIndices, isHidden],
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!isDragging.current || dragStartIdx.current === undefined) return;

      const idx = getCellIdxFromPoint(e.clientX, e.clientY);
      if (idx === undefined || isHidden(idx)) return;

      setPreviewIndices(getRectIndices(dragStartIdx.current, idx));
    },
    [isHidden],
  );

  const handlePointerUp = useCallback(() => {
    // previewIndices는 최신 상태가 아닐 수 있으니 setState 콜백 없이 “현재 렌더 기준”으로만 커밋
    // (기존 코드 유지하고 싶으면 그대로 사용해도 됨)
    isDragging.current = false;
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

// --- 마스크(배열) 기반 레이어 상태 생성 ---

type LayerMasks = {
  valid: boolean[]; // !hidden
  confirmedOn: boolean[]; // 확정 fill 대상
  previewAdjOn: boolean[]; // 프리뷰 연결 판단 대상
  previewFillOn: boolean[]; // 프리뷰 실제 fill 대상(드래그 중)
};

function buildLayerMasks(args: {
  cells: Cell[];
  selected: Set<number>;
  preview: Set<number>;
  dragMode: DragMode;
}): LayerMasks {
  const { cells, selected, preview, dragMode } = args;
  const n = cells.length;

  const valid = new Array<boolean>(n);
  for (let i = 0; i < n; i++) valid[i] = !cells[i]?.hidden;

  const isDragging = preview.size > 0;

  const confirmedOn = new Array<boolean>(n).fill(false);
  const previewAdjOn = new Array<boolean>(n).fill(false);
  const previewFillOn = new Array<boolean>(n).fill(false);

  for (let i = 0; i < n; i++) {
    if (!valid[i]) continue;

    const isSel = selected.has(i);
    const isPrev = preview.has(i);

    // 확정 레이어: deselect 프리뷰에 걸린 확정은 확정칠에서 제외
    confirmedOn[i] = isSel && !(dragMode === "deselect" && isPrev);

    // 프리뷰 연결 판단 레이어 (기존 로직과 동치)
    if (dragMode === "select") {
      previewAdjOn[i] = isSel || isPrev;
    } else {
      const isDeselecting = isPrev && isSel;
      const isRemaining = isSel && !isPrev;
      previewAdjOn[i] = isDeselecting || isRemaining;
    }

    // 프리뷰 실제 fill: 드래그 중이면 확정 셀도 프리뷰 색으로 칠함(기존 유지)
    if (isDragging) {
      previewFillOn[i] = isSel || isPrev;
    }
  }

  return { valid, confirmedOn, previewAdjOn, previewFillOn };
}

// --- 코너/오목 패치 계산 (6/8 그대로 사용) ---

type Corners = { tl: boolean; tr: boolean; bl: boolean; br: boolean };

function rowOf(i: number) {
  return (i / W) | 0;
}
function colOf(i: number) {
  return i % W;
}
function inBounds(i: number, n: number) {
  return i >= 0 && i < n;
}

function computeOuterCorners(
  on: boolean[],
  valid: boolean[],
  idx: number,
): Corners & {
  diagTL: boolean;
  diagTR: boolean;
  diagBL: boolean;
  diagBR: boolean;
  top: boolean;
  bottom: boolean;
  left: boolean;
  right: boolean;
} {
  const n = on.length;
  if (!valid[idx] || !on[idx]) {
    return {
      tl: false,
      tr: false,
      bl: false,
      br: false,
      diagTL: false,
      diagTR: false,
      diagBL: false,
      diagBR: false,
      top: false,
      bottom: false,
      left: false,
      right: false,
    };
  }

  const r = rowOf(idx);
  const c = colOf(idx);

  const up = idx - 7;
  const down = idx + 7;
  const leftI = idx - 1;
  const rightI = idx + 1;

  const top = r > 0 && valid[up] && on[up];
  const bottom = r < 4 && valid[down] && on[down];
  const left = c > 0 && valid[leftI] && on[leftI];
  const right = c < 6 && valid[rightI] && on[rightI];

  const tl = !top && !left;
  const tr = !top && !right;
  const bl = !bottom && !left;
  const br = !bottom && !right;

  // 대각(6/8) 그대로
  const diagTLi = idx - 8;
  const diagTRi = idx - 6;
  const diagBLi = idx + 6;
  const diagBRi = idx + 8;

  const diagTL =
    r > 0 &&
    c > 0 &&
    inBounds(diagTLi, n) &&
    valid[diagTLi] &&
    on[diagTLi] &&
    !top &&
    !left;
  const diagTR =
    r > 0 &&
    c < 6 &&
    inBounds(diagTRi, n) &&
    valid[diagTRi] &&
    on[diagTRi] &&
    !top &&
    !right;
  const diagBL =
    r < 4 &&
    c > 0 &&
    inBounds(diagBLi, n) &&
    valid[diagBLi] &&
    on[diagBLi] &&
    !bottom &&
    !left;
  const diagBR =
    r < 4 &&
    c < 6 &&
    inBounds(diagBRi, n) &&
    valid[diagBRi] &&
    on[diagBRi] &&
    !bottom &&
    !right;

  return {
    tl,
    tr,
    bl,
    br,
    diagTL,
    diagTR,
    diagBL,
    diagBR,
    top,
    bottom,
    left,
    right,
  };
}

function computeInnerConcavePatches(
  adjOn: boolean[],
  valid: boolean[],
  idx: number,
  selfOn: boolean,
): Corners {
  if (selfOn) return { tl: false, tr: false, bl: false, br: false };

  const r = rowOf(idx);
  const c = colOf(idx);

  const up = idx - 7;
  const down = idx + 7;
  const leftI = idx - 1;
  const rightI = idx + 1;

  const upOn = r > 0 && valid[up] && adjOn[up];
  const downOn = r < 4 && valid[down] && adjOn[down];
  const leftOn = c > 0 && valid[leftI] && adjOn[leftI];
  const rightOn = c < 6 && valid[rightI] && adjOn[rightI];

  // 대각선 셀도 켜져 있어야 오목 패치 적용 (순수 대각 연결 방지)
  const diagTL = idx - 8;
  const diagTR = idx - 6;
  const diagBL = idx + 6;
  const diagBR = idx + 8;

  return {
    tl: r > 0 && c > 0 && upOn && leftOn && inBounds(diagTL, adjOn.length) && valid[diagTL] && adjOn[diagTL],
    tr: r > 0 && c < 6 && upOn && rightOn && inBounds(diagTR, adjOn.length) && valid[diagTR] && adjOn[diagTR],
    bl: r < 4 && c > 0 && downOn && leftOn && inBounds(diagBL, adjOn.length) && valid[diagBL] && adjOn[diagBL],
    br: r < 4 && c < 6 && downOn && rightOn && inBounds(diagBR, adjOn.length) && valid[diagBR] && adjOn[diagBR],
  };
}

// --- 코너 패치 렌더링 헬퍼 (기존 그대로) ---

const corners: ("tl" | "tr" | "bl" | "br")[] = ["tl", "tr", "bl", "br"];

function cornerStyle(pos: "tl" | "tr" | "bl" | "br"): React.CSSProperties {
  const base: React.CSSProperties = {
    position: "absolute",
    width: 8,
    height: 8,
    overflow: "hidden",
  };
  if (pos.includes("t")) base.top = 0;
  else base.bottom = 0;

  if (pos.includes("l")) base.left = 0;
  else base.right = 0;

  return base;
}

function concaveInnerRound(pos: "tl" | "tr" | "bl" | "br") {
  if (pos === "tl") return "rounded-tl-lg";
  if (pos === "tr") return "rounded-tr-lg";
  if (pos === "bl") return "rounded-bl-lg";
  return "rounded-br-lg";
}

// --- 컴포넌트 ---

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

  const masks = useMemo(
    () =>
      buildLayerMasks({
        cells,
        selected: selectedIndices,
        preview: previewIndices,
        dragMode,
      }),
    [cells, selectedIndices, previewIndices, dragMode],
  );

  const isDragging = previewIndices.size > 0;
  const previewBg = dragMode === "select" ? adaptive.blue200 : adaptive.blue50;
  const confirmedBg = adaptive.blue300;

  return (
    <div className="w-full px-5 py-4">
      {/* 요일 헤더 */}
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

      {/* 날짜 그리드 */}
      <div
        className="mt-3 grid grid-cols-7"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        style={{ touchAction: "none" }}
      >
        {cells.map((cell, idx) => {
          const valid = masks.valid[idx];

          const showConfirmed = masks.confirmedOn[idx];
          const showPreview = isDragging && masks.previewFillOn[idx];

          // 확정/프리뷰 코너 계산 (프리뷰 코너는 "연결 판단 레이어" 기준)
          const c = computeOuterCorners(masks.confirmedOn, masks.valid, idx);
          const p = computeOuterCorners(masks.previewAdjOn, masks.valid, idx);

          // 내부 오목 패치
          const confirmedInner = computeInnerConcavePatches(
            masks.confirmedOn,
            masks.valid,
            idx,
            showConfirmed,
          );
          const previewInner = computeInnerConcavePatches(
            masks.previewAdjOn,
            masks.valid,
            idx,
            showPreview,
          );

          // 텍스트 색
          let textColor: string;
          if (showConfirmed) {
            textColor = "#ffffff";
          } else if (showPreview && dragMode === "select") {
            textColor = "#ffffff";
          } else {
            textColor = cell.isCurrentMonth
              ? adaptive.grey800
              : adaptive.grey400;
          }

          return (
            <div
              key={idx}
              data-cell-idx={idx}
              className={cn(
                "relative select-none flex items-center justify-center w-full aspect-square",
                !valid && "opacity-0 pointer-events-none",
              )}
            >
              {/* 프리뷰 레이어 */}
              {showPreview && (
                <div
                  className={cn(
                    "absolute inset-0 z-10",
                    p.tl && "rounded-tl-lg",
                    p.tr && "rounded-tr-lg",
                    p.bl && "rounded-bl-lg",
                    p.br && "rounded-br-lg",
                  )}
                  style={{ backgroundColor: previewBg }}
                />
              )}

              {/* 프리뷰 내부 오목 코너 패치 */}
              {isDragging &&
                corners.map((pos) => {
                  if (!previewInner[pos]) return null;
                  return (
                    <div
                      key={`p-${pos}`}
                      className="z-10"
                      style={{
                        ...cornerStyle(pos),
                        backgroundColor: previewBg,
                      }}
                    >
                      <div
                        className={cn("h-full w-full", concaveInnerRound(pos))}
                        style={{ backgroundColor: "white" }}
                      />
                    </div>
                  );
                })}

              {/* 확정 선택 레이어 */}
              {showConfirmed && (
                <div
                  className={cn(
                    "absolute inset-0 z-20",
                    c.tl && "rounded-tl-lg",
                    c.tr && "rounded-tr-lg",
                    c.bl && "rounded-bl-lg",
                    c.br && "rounded-br-lg",
                  )}
                  style={{ backgroundColor: confirmedBg }}
                />
              )}

              {/* 확정 내부 오목 코너 패치 */}
              {corners.map((pos) => {
                if (!confirmedInner[pos]) return null;
                return (
                  <div
                    key={`c-${pos}`}
                    className="z-20"
                    style={{
                      ...cornerStyle(pos),
                      backgroundColor: confirmedBg,
                    }}
                  >
                    <div
                      className={cn("h-full w-full", concaveInnerRound(pos))}
                      style={{ backgroundColor: "white" }}
                    />
                  </div>
                );
              })}

              {cell.isToday && !showConfirmed && !showPreview && (
                <div
                  className="absolute rounded-full"
                  style={{
                    width: 42,
                    height: 42,
                    border: `2px solid ${confirmedBg}`,
                  }}
                />
              )}

              <span
                className="relative z-30"
                style={{
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
