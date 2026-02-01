import { useCallback, useMemo, useRef, useState } from "react";
import { adaptive } from "@toss/tds-colors";
import type { CalendarCell } from "@/lib/calendar";
import { buildCalendarCells } from "@/lib/calendar";
import {
  type Rect,
  useDateSelectionStore,
} from "@/stores/useDateSelectionStore";
import { useLongPressDrag } from "@/hooks/useLongPressDrag";
import {
  type Owner,
  type DragMode,
  type RenderCell,
  buildRenderGrid,
} from "@/lib/renderGrid";
import CalendarGrid2, { type CalendarCellModel } from "./CalendarGrid2";

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

function ownerColor(owner: Owner, dragMode: DragMode) {
  if (owner === "confirmed")
    return { bg: adaptive.blue300, whiteText: true };
  if (owner === "preview")
    return dragMode === "select"
      ? { bg: adaptive.blue200, whiteText: true }
      : { bg: adaptive.blue50, whiteText: false };
  return { bg: "white", whiteText: false };
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

  const { onPointerDown, onPointerMove, onPointerUp, onPointerCancel } =
    useLongPressDrag({
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
    handlePointerCancel: onPointerCancel,
  };
}

function buildCalendarCellModels(
  cells: CalendarCell[],
  renderGrid: RenderCell[][],
  dragMode: DragMode,
): CalendarCellModel[] {
  const today = new Date();
  const currentMonth = today.getMonth();

  return cells.map((cell, idx) => {
    const r = rowOf(idx);
    const c = colOf(idx);
    const rc = renderGrid[r][c];

    const center = rc.lt.center;
    const { bg: centerBg, whiteText } = ownerColor(center, dragMode);
    const isCurrentMonth = cell.date.getMonth() === currentMonth;

    let textColor: string;
    if (center !== "empty") {
      textColor = whiteText
        ? "#ffffff"
        : isCurrentMonth
          ? adaptive.grey800
          : adaptive.grey400;
    } else {
      textColor = isCurrentMonth ? adaptive.grey800 : adaptive.grey400;
    }

    // Corner colors - 항상 색상 설정 (empty는 white)
    const lt = ownerColor(rc.lt.corner, dragMode).bg;
    const rt = ownerColor(rc.rt.corner, dragMode).bg;
    const lb = ownerColor(rc.lb.corner, dragMode).bg;
    const rb = ownerColor(rc.rb.corner, dragMode).bg;

    return {
      hidden: cell.hidden,
      day: cell.day,
      isToday: cell.isToday,
      textColor,
      center: center !== "empty" ? centerBg : undefined,
      lt,
      rt,
      lb,
      rb,
    };
  });
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
    handlePointerCancel,
  } = useDateDragSelection((idx) => cells[idx]?.hidden ?? true);

  const renderGrid = useMemo(
    () => buildRenderGrid({ confirmed, preview, dragMode }),
    [confirmed, preview, dragMode],
  );

  const calendarCells = useMemo(
    () => buildCalendarCellModels(cells, renderGrid, dragMode),
    [cells, renderGrid, dragMode],
  );

  return (
    <CalendarGrid2
      cells={calendarCells}
      pointerHandlers={{
        onPointerDown: handlePointerDown,
        onPointerMove: handlePointerMove,
        onPointerUp: handlePointerUp,
        onPointerCancel: handlePointerCancel,
      }}
    />
  );
}
