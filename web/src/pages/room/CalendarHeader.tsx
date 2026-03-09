import { useCallback, useRef } from "react";
import { generateHapticFeedback } from "@/lib/haptics";
import { useTranslation } from "react-i18next";
import { formatDateHeader } from "@/lib/timeSlots";
import { CELL_W, getHeaderColFromPoint } from "@/lib/gridUtils";
import type { WeekColumn } from "@/lib/weekGroup";
import { palette } from "@/lib/palette";

const LONG_PRESS_MS = 250;
const MOVE_CANCEL_PX = 8;

interface CalendarHeaderProps {
  /** 현재 주(week)에 표시할 날짜 컬럼 목록 (날짜 텍스트 렌더링에 사용) */
  columns: WeekColumn[];
  /** 각 컬럼이 전체 선택된 상태인지 여부 (true면 파란색 bold 표시) */
  allSelectedCols: boolean[];
  /** 롱프레스 없이 탭했을 때 — 단일 컬럼 토글 */
  onTap: (col: number) => void;
  /** 롱프레스 후 드래그 완료 — 범위 확정 */
  onSelect: (dc0: number, dc1: number) => void;
  /** 롱프레스 후 드래그 중 — 범위 미리보기 */
  onPreview?: (dc0: number, dc1: number) => void;
  /** 드래그 취소 또는 완료 후 미리보기 초기화 */
  onCancelPreview?: () => void;
}

export default function CalendarHeader({
  columns,
  allSelectedCols,
  onTap,
  onSelect,
  onPreview,
  onCancelPreview,
}: CalendarHeaderProps) {
  const { t } = useTranslation();
  const weekdays = t("weekdays", { returnObjects: true }) as string[];
  const dateHeaders = columns.map((col) => formatDateHeader(col.date, weekdays));
  const displayCols = columns.length;

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

  const confirmOrCancelDrag = useCallback(() => {
    if (longPressActivatedRef.current && startColRef.current != null) {
      const start = startColRef.current;
      const end = currentColRef.current ?? start;
      onSelect(Math.min(start, end), Math.max(start, end));
    }
    onCancelPreview?.();
  }, [onSelect, onCancelPreview]);

  const handlePointerDown = useCallback(
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

  const handlePointerMove = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (pointerIdRef.current !== e.pointerId) return;
      if (startColRef.current == null) return;

      const startPt = pressStartPointRef.current;
      if (!longPressActivatedRef.current && startPt) {
        const dx = e.clientX - startPt.x;
        const dy = e.clientY - startPt.y;
        if (Math.sqrt(dx * dx + dy * dy) > MOVE_CANCEL_PX) {
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

  const handlePointerUp = useCallback(
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

  const handlePointerCancel = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (pointerIdRef.current !== e.pointerId) return;
      clearLongPressTimer();
      confirmOrCancelDrag();
      resetState();
    },
    [clearLongPressTimer, confirmOrCancelDrag, resetState],
  );

  const handleLostPointerCapture = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (pointerIdRef.current !== e.pointerId) return;
      clearLongPressTimer();
      confirmOrCancelDrag();
      resetState();
    },
    [clearLongPressTimer, confirmOrCancelDrag, resetState],
  );

  return (
    <div
      className="flex w-full"
      style={{ touchAction: "none" }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerCancel}
      onLostPointerCapture={handleLostPointerCapture}
    >
      {dateHeaders.map((h, i) => (
        <div
          key={columns[i].date}
          data-header-col={i}
          className="flex-1 text-center select-none"
          style={{ minWidth: CELL_W }}
        >
          <div
            style={{
              fontSize: 13,
              fontWeight: allSelectedCols[i] ? 700 : 400,
              color: allSelectedCols[i]
                ? palette.blue400
                : h.dayOfWeek === 0
                  ? palette.red400
                  : h.dayOfWeek === 6
                    ? palette.blue300
                    : palette.grey500,
            }}
          >
            {`${h.day} (${h.weekday})`}
          </div>
        </div>
      ))}
    </div>
  );
}
