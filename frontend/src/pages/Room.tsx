import { useParams } from "react-router-dom";
import { Tab, Top } from "@toss/tds-mobile";
import { adaptive } from "@toss/tds-colors";
import { useRoomsControllerFindById } from "../api/model/rooms/rooms";
import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { groupDatesByWeek } from "@/lib/weekGroup";
import { formatDateHeader } from "@/lib/timeSlots";
import AvailabilityGrid from "../components/AvailabilityGrid";
import OverviewGrid from "../components/OverviewGrid";

export default function Room() {
  const { id } = useParams<{ id: string }>();
  const { data: response, isLoading } = useRoomsControllerFindById(id!);
  const [selected, setSelected] = useState(0);
  const [weekIdx, setWeekIdx] = useState(0);

  const weeks = useMemo(() => {
    if (!response || response.status !== 200) return [];
    return groupDatesByWeek(response.data.data.room.dates);
  }, [response]);

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <span style={{ color: adaptive.grey500 }}>로딩 중...</span>
      </div>
    );
  }

  if (!response || response.status !== 200) {
    return (
      <div className="flex h-screen items-center justify-center">
        <span style={{ color: adaptive.grey500 }}>방을 찾을 수 없습니다</span>
      </div>
    );
  }

  const { room, participants } = response.data.data;
  const totalCols = room.dates.length;
  const currentWeek = weeks[weekIdx];

  if (!currentWeek) return null;

  const firstDate = currentWeek.columns[0].date;
  const lastDate = currentWeek.columns[currentWeek.columns.length - 1].date;
  const firstHeader = formatDateHeader(firstDate);
  const lastHeader = formatDateHeader(lastDate);
  const weekLabel =
    currentWeek.columns.length === 1
      ? firstHeader.label
      : `${firstHeader.label} - ${lastHeader.label}`;

  return (
    <div className="flex h-screen flex-col">
      <Top
        title={
          <Top.TitleParagraph size={28} color={adaptive.grey900}>
            {room.name}
          </Top.TitleParagraph>
        }
      />
      <Tab size="large" onChange={(index) => setSelected(index)}>
        <Tab.Item selected={selected === 0}>일정선택</Tab.Item>
        <Tab.Item selected={selected === 1}>전체보기</Tab.Item>
        <Tab.Item selected={selected === 2}>참여자</Tab.Item>
      </Tab>

      {/* Week navigation */}
      {(selected === 0 || selected === 1) && weeks.length > 1 && (
        <div className="flex items-center justify-center gap-4 px-4 pt-3">
          <button
            type="button"
            className="cursor-pointer p-1"
            disabled={weekIdx === 0}
            onClick={() => setWeekIdx((i) => i - 1)}
          >
            <ChevronLeft
              size={20}
              color={weekIdx === 0 ? adaptive.grey300 : adaptive.grey700}
            />
          </button>
          <span style={{ fontSize: 14, color: adaptive.grey700 }}>
            {weekLabel}
          </span>
          <button
            type="button"
            className="cursor-pointer p-1"
            disabled={weekIdx === weeks.length - 1}
            onClick={() => setWeekIdx((i) => i + 1)}
          >
            <ChevronRight
              size={20}
              color={
                weekIdx === weeks.length - 1
                  ? adaptive.grey300
                  : adaptive.grey700
              }
            />
          </button>
        </div>
      )}

      <div className="min-h-0 flex-1 overflow-y-auto">
        {selected === 0 && (
          <AvailabilityGrid
            columns={currentWeek.columns}
            totalCols={totalCols}
            startTime={room.startTime}
            endTime={room.endTime}
          />
        )}
        {selected === 1 && (
          <OverviewGrid
            columns={currentWeek.columns}
            startTime={room.startTime}
            endTime={room.endTime}
            participants={participants}
          />
        )}
      </div>
    </div>
  );
}
