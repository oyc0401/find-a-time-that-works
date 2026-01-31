import { useCallback, useMemo, useRef, useState } from "react";
import { adaptive } from "@toss/tds-colors";
import { cn } from "@/lib/cn";
import { useDateSelectionStore } from "@/stores/useDateSelectionStore";

const TOTAL_CELLS = 35; // 5줄 × 7칸
const weekdays = ["일", "월", "화", "수", "목", "금", "토"];

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

    // 이번달 전체 셀 생성
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

    // 오늘 이전 날짜가 숨겨져서 줄이 줄어든 만큼 다음달로 채움
    // 숨겨진 날짜가 있는 첫 줄이 완전히 숨겨지면 그 줄을 제거하고 다음달을 추가
    // 먼저: 앞쪽에서 완전히 hidden인 줄(7칸) 수 계산
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

    // 정확히 35개만
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
    if (isDragging.current && previewIndices.size > 0) {
      if (dragMode === "select") {
        select(previewIndices);
      } else {
        deselect(previewIndices);
      }
    }
    isDragging.current = false;
    dragStartIdx.current = undefined;
    setPreviewIndices(new Set());
  }, [previewIndices, dragMode, select, deselect]);

  return {
    selectedIndices,
    previewIndices,
    dragMode,
    handlePointerDown,
    handlePointerMove,
    handlePointerUp,
  };
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
        className="mt-3 grid grid-cols-7 place-items-center"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        style={{ touchAction: "none" }}
      >
        {cells.map((cell, idx) => {
          const isConfirmed = selectedIndices.has(idx) && !cell.hidden;
          const isPreviewing = previewIndices.has(idx) && !cell.hidden;

          // 셀의 최종 표시 상태 결정
          let circleColor: string | undefined;
          let textColor: string;

          if (isPreviewing && dragMode === "select" && !isConfirmed) {
            // 선택 예정: 아직 선택 안 된 셀만
            circleColor = adaptive.blue200;
          } else if (isPreviewing && dragMode === "deselect" && isConfirmed) {
            // 해제 예정: 이미 선택된 셀만
            circleColor = adaptive.blue50;
          } else if (isConfirmed) {
            // 확정된 선택
            circleColor = adaptive.blue300;
          }

          if (circleColor === adaptive.blue300 || circleColor === adaptive.blue200) {
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
                "relative select-none flex items-center justify-center py-2 w-full aspect-square",
                cell.hidden && "opacity-0 pointer-events-none",
              )}
            >
              {circleColor && (
                <div
                  className="absolute rounded-full"
                  style={{
                    width: 42,
                    height: 42,
                    backgroundColor: circleColor,
                  }}
                />
              )}
              {cell.isToday && !circleColor && (
                <div
                  className="absolute rounded-full"
                  style={{
                    width: 42,
                    height: 42,
                    border: `2px solid ${adaptive.blue300}`,
                  }}
                />
              )}
              <span
                className="relative"
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
