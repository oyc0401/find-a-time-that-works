import { useCallback, useEffect, useRef } from "react";
import { generateHapticFeedback } from "@apps-in-toss/web-framework";

const DEFAULT_DURATION = 250;

type PointerHandlers = {
  onPointerDown: (e: React.PointerEvent) => void;
  onPointerMove: (e: React.PointerEvent) => void;
  onPointerUp: () => void;
  onPointerCancel: () => void;
  onLostPointerCapture: () => void;
};

export function useLongPressDrag<TCell>({
  duration = DEFAULT_DURATION,
  getCellFromPoint,
  isSameCell = (a, b) => a === b,
  onLongPressStart,
  onDrag,
  onTap,
  onEnd,
}: {
  duration?: number;
  getCellFromPoint: (x: number, y: number) => TCell | undefined;
  isSameCell?: (a: TCell, b: TCell) => boolean;
  onLongPressStart: (cell: TCell, e: React.PointerEvent) => void;
  onDrag: (cell: TCell) => void;
  onTap: (cell: TCell) => void;
  onEnd: () => void;
}): PointerHandlers {
  const startCellRef = useRef<TCell | undefined>(undefined);
  const isDraggingRef = useRef(false);
  const hasMovedRef = useRef(false);
  const longPressTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(
    undefined,
  );
  const pointerIdRef = useRef<number | undefined>(undefined);
  const containerRef = useRef<HTMLElement | undefined>(undefined);

  const clearTimer = useCallback(() => {
    if (longPressTimerRef.current !== undefined) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = undefined;
    }
  }, []);

  // 드래그 중 touchmove 스크롤 차단
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

  const resetDragState = useCallback(() => {
    clearTimer();
    const wasDragging = isDraggingRef.current;
    isDraggingRef.current = false;
    startCellRef.current = undefined;
    pointerIdRef.current = undefined;
    containerRef.current = undefined;
    hasMovedRef.current = false;
    return wasDragging;
  }, [clearTimer]);

  const onLostPointerCapture = useCallback(() => {
    if (isDraggingRef.current) {
      resetDragState();
      onEnd();
    }
  }, [resetDragState, onEnd]);

  const onPointerDown = useCallback(
    (e: React.PointerEvent) => {
      // 이전 드래그가 정리되지 않고 남아있으면 강제 정리
      if (isDraggingRef.current) {
        resetDragState();
        onEnd();
      }

      const cell = getCellFromPoint(e.clientX, e.clientY);
      if (cell === undefined) return;

      startCellRef.current = cell;
      pointerIdRef.current = e.pointerId;
      containerRef.current = e.currentTarget as HTMLElement;
      hasMovedRef.current = false;

      clearTimer();
      longPressTimerRef.current = setTimeout(() => {
        if (hasMovedRef.current) return;
        if (startCellRef.current === undefined) return;

        if (containerRef.current && pointerIdRef.current !== undefined) {
          containerRef.current.setPointerCapture(pointerIdRef.current);
        }

        generateHapticFeedback({ type: "softMedium" });
        isDraggingRef.current = true;
        onLongPressStart(startCellRef.current, e);
      }, duration);
    },
    [getCellFromPoint, onLongPressStart, duration, clearTimer, resetDragState, onEnd],
  );

  const onPointerMove = useCallback(
    (e: React.PointerEvent) => {
      // 롱프레스 대기 중 움직이면 취소
      if (
        !hasMovedRef.current &&
        startCellRef.current !== undefined &&
        !isDraggingRef.current
      ) {
        const currentCell = getCellFromPoint(e.clientX, e.clientY);
        if (
          currentCell === undefined ||
          !isSameCell(currentCell, startCellRef.current)
        ) {
          hasMovedRef.current = true;
          clearTimer();
          return;
        }
      }

      if (!isDraggingRef.current || startCellRef.current === undefined) return;

      const cell = getCellFromPoint(e.clientX, e.clientY);
      if (cell === undefined) return;

      onDrag(cell);
    },
    [getCellFromPoint, isSameCell, onDrag, clearTimer],
  );

  const onPointerUp = useCallback(() => {
    const startCell = startCellRef.current;
    const hasMoved = hasMovedRef.current;
    const wasDragging = resetDragState();

    if (wasDragging) {
      onEnd();
    } else if (startCell !== undefined && !hasMoved) {
      onTap(startCell);
    }
  }, [onEnd, onTap, resetDragState]);

  const onPointerCancel = useCallback(() => {
    const wasDragging = resetDragState();

    // cancel 시에는 드래그 중이었을 때만 onEnd, 탭은 무시
    if (wasDragging) {
      onEnd();
    }
  }, [onEnd, resetDragState]);

  return {
    onPointerDown,
    onPointerMove,
    onPointerUp,
    onPointerCancel,
    onLostPointerCapture,
  };
}
