import { useMemo } from "react";
import { useParams } from "react-router-dom";
import { formatDateHeader } from "@/lib/timeSlots";
import ArrowDownIcon from "@/assets/icon-arrow-down-small-blue-4E5968,arrow,down,downarrow,arrowdown.svg";
import ArrowLeftIcon from "@/assets/icon-arrow-left-sidebar-mono,화살표,arrow,left,왼쪽.svg";
import ArrowRightIcon from "@/assets/icon-arrow-right-sidebar-mono,화살표,arrow,오른쪽,right.svg";
import { useRoomData } from "@/hooks/useRoomData";
import { useRoomStore } from "@/stores/useRoomStore";

interface WeekNavigationProps {
  onDateClick?: () => void;
}

export default function WeekNavigation({ onDateClick }: WeekNavigationProps) {
  const { id } = useParams<{ id: string }>();
  const { weeks } = useRoomData(id);
  const { weekIdx, setWeekIdx } = useRoomStore();

  const weekLabel = useMemo(() => {
    const currentWeek = weeks[weekIdx];
    if (!currentWeek) return undefined;

    // 주에 포함된 날짜 중 가장 많은 월을 대표 월로 사용
    const monthCounts = new Map<number, number>();
    for (const col of currentWeek.columns) {
      const month = new Date(col.date).getMonth() + 1;
      monthCounts.set(month, (monthCounts.get(month) ?? 0) + 1);
    }
    let repMonth = 0;
    let maxCount = 0;
    for (const [month, count] of monthCounts) {
      if (count > maxCount || (count === maxCount && month > repMonth)) {
        repMonth = month;
        maxCount = count;
      }
    }

    // 해당 월의 몇 번째 주인지 계산 (일~토 기준)
    // 월의 1일이 속한 주를 1주로 봄
    const year = new Date(currentWeek.columns[0].date).getFullYear();
    const firstOfMonth = new Date(year, repMonth - 1, 1);
    const firstSunday = new Date(firstOfMonth);
    firstSunday.setDate(1 - firstOfMonth.getDay()); // 1일이 속한 주의 일요일

    // 현재 주의 일요일 구하기
    const refDate = new Date(currentWeek.columns[0].date);
    const currentSunday = new Date(refDate);
    currentSunday.setDate(refDate.getDate() - refDate.getDay());

    const diffWeeks = Math.round(
      (currentSunday.getTime() - firstSunday.getTime()) /
        (7 * 24 * 60 * 60 * 1000),
    );
    const weekNum = diffWeeks + 1;

    return `${repMonth}월 ${weekNum}주`;
  }, [weeks, weekIdx]);

  if (weeks.length <= 1) return null;
  if (!weekLabel) return null;

  return (
    <div className="flex items-center justify-between pt-3 pl-4 pr-4 pb-1">
      <button
        type="button"
        className="flex items-center gap-0.5 cursor-pointer whitespace-nowrap shrink-0"
        style={{ fontSize: 20, fontWeight: 500 }}
        onClick={onDateClick}
      >
        {weekLabel}
        <img src={ArrowDownIcon} alt="" width={24} height={24} />
      </button>
      <div className="flex items-center">
        <button
          type="button"
          className="flex items-center justify-center cursor-pointer"
          style={{ width: 44, height: 44, opacity: weekIdx === 0 ? 0.3 : 1 }}
          disabled={weekIdx === 0}
          onClick={() => setWeekIdx(weekIdx - 1)}
        >
          <img src={ArrowLeftIcon} alt="이전 주" width={24} height={24} />
        </button>
        <button
          type="button"
          className="flex items-center justify-center cursor-pointer"
          style={{ width: 44, height: 44, opacity: weekIdx === weeks.length - 1 ? 0.3 : 1 }}
          disabled={weekIdx === weeks.length - 1}
          onClick={() => setWeekIdx(weekIdx + 1)}
        >
          <img src={ArrowRightIcon} alt="다음 주" width={24} height={24} />
        </button>
      </div>
    </div>
  );
}
