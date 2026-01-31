import { useMemo } from "react";
import { Text } from "@toss/tds-mobile";
import { adaptive } from "@toss/tds-colors";

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

export default function DateSelector() {
  const cells = useCalendarCells();

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
      <div className="mt-5 grid grid-cols-7 place-items-center gap-y-4">
        {cells.map((cell, idx) => (
          <div
            key={idx}
            className={[
              "relative select-none flex items-center justify-center",
              cell.hidden ? "opacity-0" : "",
            ].join(" ")}
          >
            {cell.isToday && (
              <div
                className="absolute rounded-full"
                style={{
                  width: 36,
                  height: 36,
                  border: `2px solid ${adaptive.blue300}`,
                }}
              />
            )}
            <span
              style={{
                fontSize: 20,
                lineHeight: "29px",
                color: cell.isCurrentMonth
                  ? adaptive.grey800
                  : adaptive.grey400,
              }}
            >
              {cell.day}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
