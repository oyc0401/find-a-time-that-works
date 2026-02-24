import { useCallback, useRef } from "react";
import { generateHapticFeedback } from "@apps-in-toss/web-framework";
import { getHeaderColFromPoint } from "@/lib/gridUtils";

const LONG_PRESS_MS = 250;
const MOVE_CANCEL_PX = 8;

interface UseHeaderLongPressDragOptions {
  displayCols: number;
  onTap: (col: number) => void;
  onSelect: (dc0: number, dc1: number) => void;
  onPreview?: (dc0: number, dc1: number) => void;
  onCancelPreview?: () => void;
}

type HeaderPointerHandlers = {
  onPointerDown: (e: React.PointerEvent<HTMLDivElement>) => void;
  onPointerMove: (e: React.PointerEvent<HTMLDivElement>) => void;
  onPointerUp: (e: React.PointerEvent<HTMLDivElement>) => void;
  onPointerCancel: (e: React.PointerEvent<HTMLDivElement>) => void;
  onLostPointerCapture: (e: React.PointerEvent<HTMLDivElement>) => void;
};

export function useHeaderLongPressDrag({
  displayCols,
  onTap,
  onSelect,
  onPreview,
  onCancelPreview,
}: UseHeaderLongPressDragOptions): HeaderPointerHandlers {
  const longPressTimerRef = useRef<number | null>(null);
  const pointerIdRef = useRef<number | null>(null);
  const startColRef = useRef<number | null>(null);
  const currentColRef = useRef<number | null>(null);
  const longPressActivatedRef = useRef(false);
  const pressStartPointRef = useRef<{ x: number; y: number } | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const clearLongPressTimer = useCallback(() => {
    if (longPressTimerRef.current != null) {
      window.clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  }, []);

  const resetState = useCallback(() => {
    pointerIdRef.current = null;
    startColRef.current = null;
    currentColRef.current = null;
    longPressActivatedRef.current = false;
    pressStartPointRef.current = null;
    containerRef.current = null;
  }, []);

  const onPointerDown = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      const col = getHeaderColFromPoint(e.clientX, e.clientY);
      if (col == null) return;

      e.currentTarget.setPointerCapture(e.pointerId);
      containerRef.current = e.currentTarget;
      pointerIdRef.current = e.pointerId;
      startColRef.current = col;
      currentColRef.current = col;
      longPressActivatedRef.current = false;
      pressStartPointRef.current = { x: e.clientX, y: e.clientY };

      clearLongPressTimer();
      longPressTimerRef.current = window.setTimeout(() => {
        if (startColRef.current == null) return;
        longPressActivatedRef.current = true;
        generateHapticFeedback({ type: "softMedium" });
        onPreview?.(startColRef.current, startColRef.current);
      }, LONG_PRESS_MS);
    },
    [clearLongPressTimer, onPreview],
  );

  const onPointerMove = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (pointerIdRef.current !== e.pointerId) return;
      if (startColRef.current == null) return;

      const startPt = pressStartPointRef.current;
      if (!longPressActivatedRef.current && startPt) {
        const dx = e.clientX - startPt.x;
        const dy = e.clientY - startPt.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist > MOVE_CANCEL_PX) {
          clearLongPressTimer();
        }
      }

      if (!longPressActivatedRef.current) return;

      let col = getHeaderColFromPoint(e.clientX, e.clientY);
      if (col == null && containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        const clampedX = Math.max(rect.left, Math.min(rect.right - 1, e.clientX));
        const rawCol = Math.floor(((clampedX - rect.left) / rect.width) * displayCols);
        col = Math.max(0, Math.min(displayCols - 1, rawCol));
      }

      if (col == null) return;
      if (currentColRef.current === col) return;

      currentColRef.current = col;
      generateHapticFeedback({ type: "tickWeak" });
      const start = startColRef.current;
      onPreview?.(Math.min(start, col), Math.max(start, col));
    },
    [clearLongPressTimer, displayCols, onPreview],
  );

  const onPointerUp = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (pointerIdRef.current !== e.pointerId) return;

      clearLongPressTimer();
      const startCol = startColRef.current;
      const currentCol = currentColRef.current;
      const wasLongPress = longPressActivatedRef.current;

      resetState();

      if (startCol != null) {
        if (wasLongPress) {
          const endCol = currentCol ?? startCol;
          onSelect(Math.min(startCol, endCol), Math.max(startCol, endCol));
          onCancelPreview?.();
        } else {
          generateHapticFeedback({ type: "tap" });
          onTap(startCol);
        }
      }
    },
    [clearLongPressTimer, onSelect, onCancelPreview, onTap, resetState],
  );

  const confirmOrCancelDrag = useCallback(() => {
    if (longPressActivatedRef.current && startColRef.current != null) {
      const start = startColRef.current;
      const end = currentColRef.current ?? start;
      onSelect(Math.min(start, end), Math.max(start, end));
    }
    onCancelPreview?.();
  }, [onSelect, onCancelPreview]);

  const onPointerCancel = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (pointerIdRef.current !== e.pointerId) return;
      clearLongPressTimer();
      confirmOrCancelDrag();
      resetState();
    },
    [clearLongPressTimer, confirmOrCancelDrag, resetState],
  );

  const onLostPointerCapture = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (pointerIdRef.current !== e.pointerId) return;
      clearLongPressTimer();
      confirmOrCancelDrag();
      resetState();
    },
    [clearLongPressTimer, confirmOrCancelDrag, resetState],
  );

  return {
    onPointerDown,
    onPointerMove,
    onPointerUp,
    onPointerCancel,
    onLostPointerCapture,
  };
}
