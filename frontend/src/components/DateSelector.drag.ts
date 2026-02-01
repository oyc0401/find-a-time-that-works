import { useCallback, useRef, useState } from "react";
import {
  type Rect,
  useDateSelectionStore,
} from "@/stores/useDateSelectionStore";
import { useLongPressDrag } from "@/hooks/useLongPressDrag";
import type { DragMode } from "./DateSelector.logic";

const W = 7;
const H = 5;

export function createEmptyPreview(): boolean[][] {
  return Array.from({ length: H }, () => Array(W).fill(false));
}

export function rowOf(i: number) {
  return (i / W) | 0;
}

export function colOf(i: number) {
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

function applyRect(grid: boolean[][], rect: Rect, value: boolean): boolean[][] {
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

export function useDateDragSelection(isHidden: (idx: number) => boolean) {
  const { confirmed, select, deselect } = useDateSelectionStore();

  const [preview, setPreview] = useState<boolean[][]>(createEmptyPreview);
  const [dragMode, setDragMode] = useState<DragMode>("select");

  const dragStartIdx = useRef<number | undefined>(undefined);
  const currentRect = useRef<Rect | undefined>(undefined);
  const pendingModeRef = useRef<DragMode>("select");

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
      pendingModeRef.current = mode;
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
