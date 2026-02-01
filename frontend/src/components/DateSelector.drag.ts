import { useCallback, useEffect, useRef, useState } from "react";
import { generateHapticFeedback } from "@apps-in-toss/web-framework";
import {
  type Rect,
  useDateSelectionStore,
} from "@/stores/useDateSelectionStore";
import type { DragMode } from "./DateSelector.logic";

const W = 7;
const H = 5;

const LONG_PRESS_DURATION = 300;

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
  const isDraggingRef = useRef(false);
  const longPressTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(
    undefined,
  );
  const pointerIdRef = useRef<number | undefined>(undefined);
  const containerRef = useRef<HTMLElement | undefined>(undefined);
  const pendingModeRef = useRef<DragMode>("select");
  const hasMovedRef = useRef(false);

  const clearLongPressTimer = useCallback(() => {
    if (longPressTimerRef.current !== undefined) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = undefined;
    }
  }, []);

  // 드래그 모드일 때 touchmove 기본 동작(스크롤) 차단
  useEffect(() => {
    const handleTouchMove = (e: TouchEvent) => {
      if (isDraggingRef.current) {
        e.preventDefault();
      }
    };

    document.addEventListener("touchmove", handleTouchMove, { passive: false });
    return () => {
      document.removeEventListener("touchmove", handleTouchMove);
    };
  }, []);

  const handlePointerDown = useCallback(
    (e: React.PointerEvent) => {
      const idx = getCellIdxFromPoint(e.clientX, e.clientY);
      if (idx === undefined || isHidden(idx)) return;

      dragStartIdx.current = idx;
      pointerIdRef.current = e.pointerId;
      containerRef.current = e.currentTarget as HTMLElement;
      hasMovedRef.current = false;

      const r = rowOf(idx);
      const c = colOf(idx);
      const mode: DragMode = confirmed[r][c] ? "deselect" : "select";
      pendingModeRef.current = mode;

      clearLongPressTimer();
      longPressTimerRef.current = setTimeout(() => {
        if (hasMovedRef.current) return;

        if (containerRef.current && pointerIdRef.current !== undefined) {
          containerRef.current.setPointerCapture(pointerIdRef.current);
        }

        generateHapticFeedback({ type: "tap" });

        isDraggingRef.current = true;
        setDragMode(mode);

        const rect = getRect(idx, idx);
        currentRect.current = rect;
        setPreview(applyRect(createEmptyPreview(), rect, true));
      }, LONG_PRESS_DURATION);
    },
    [isHidden, confirmed, clearLongPressTimer],
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      // 시작 셀에서 벗어나면 롱프레스 취소
      if (!hasMovedRef.current && dragStartIdx.current !== undefined && !isDraggingRef.current) {
        const currentIdx = getCellIdxFromPoint(e.clientX, e.clientY);
        if (currentIdx !== dragStartIdx.current) {
          hasMovedRef.current = true;
          clearLongPressTimer();
          return;
        }
      }

      if (!isDraggingRef.current || dragStartIdx.current === undefined) return;

      const idx = getCellIdxFromPoint(e.clientX, e.clientY);
      if (idx === undefined || isHidden(idx)) return;

      const rect = getRect(dragStartIdx.current, idx);
      currentRect.current = rect;
      setPreview(applyRect(createEmptyPreview(), rect, true));
    },
    [isHidden, clearLongPressTimer],
  );

  const handlePointerUp = useCallback(() => {
    clearLongPressTimer();

    const wasDragging = isDraggingRef.current;
    const startIdx = dragStartIdx.current;
    const hasMoved = hasMovedRef.current;

    isDraggingRef.current = false;
    dragStartIdx.current = undefined;
    pointerIdRef.current = undefined;
    containerRef.current = undefined;
    hasMovedRef.current = false;

    if (wasDragging) {
      const rect = currentRect.current;
      if (rect) {
        if (dragMode === "select") select(rect);
        else deselect(rect);
      }
    } else if (startIdx !== undefined && !hasMoved) {
      // 움직임 없이 300ms 전에 뗀 경우만 탭 선택
      const rect = getRect(startIdx, startIdx);
      if (pendingModeRef.current === "select") select(rect);
      else deselect(rect);
    }

    currentRect.current = undefined;
    setPreview(createEmptyPreview());
  }, [dragMode, select, deselect, clearLongPressTimer]);

  return {
    confirmed,
    preview,
    dragMode,
    handlePointerDown,
    handlePointerMove,
    handlePointerUp,
  };
}
