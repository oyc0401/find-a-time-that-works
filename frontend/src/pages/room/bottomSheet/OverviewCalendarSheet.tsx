import { useCallback, useMemo } from "react";
import { useParams } from "react-router-dom";
import { BottomSheet } from "@toss/tds-mobile";
import { useTranslation } from "react-i18next";
import { useRoomData } from "@/hooks/useRoomData";
import { useRoomStore } from "@/stores/useRoomStore";
import { adaptive } from "@toss/tds-colors";
import { buildCalendarCells } from "@/lib/calendar";
import { buildRenderGrid2 } from "@/lib/renderGrid2";
import { heatColor } from "@/lib/heatColor";
import CalendarGrid, { type CalendarCellModel } from "../../../components/CalendarGrid";

const W = 7;
const H = 5;

function toDateKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function countToHeatBg(count: number, maxCount: number): string {
  if (count <= 0) return "white";
  const ratio = maxCount > 0 ? (count - 1) / maxCount : 0;
  return heatColor(ratio);
}

interface HeatmapCalendarViewProps {
  baseDate: Date;
  highlightedDates: Set<string>;
  dateCountMap: Map<string, number>;
  maxCount: number;
  onDateClick?: (dateKey: string) => void;
}

function HeatmapCalendarView({
  baseDate,
  highlightedDates,
  dateCountMap,
  maxCount,
  onDateClick,
}: HeatmapCalendarViewProps) {
  const cells = useMemo(() => buildCalendarCells(baseDate), [baseDate]);

  // 가중치 기반 countGrid: 참여인원 + 1 (0은 빈칸 전용)
  const countGrid = useMemo(() => {
    const grid: number[][] = Array.from({ length: H }, () => Array(W).fill(0));
    for (let i = 0; i < cells.length; i++) {
      const dateKey = toDateKey(cells[i].date);
      if (!highlightedDates.has(dateKey)) continue;
      const r = Math.floor(i / W);
      const c = i % W;
      grid[r][c] = (dateCountMap.get(dateKey) ?? 0) + 1;
    }
    return grid;
  }, [cells, highlightedDates, dateCountMap]);

  const renderGrid = useMemo(
    () => buildRenderGrid2(countGrid),
    [countGrid],
  );

  const calendarCells: CalendarCellModel[] = useMemo(() => {
    const today = new Date();
    const todayStart = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate(),
    );

    return cells.map((cell, idx) => {
      const r = Math.floor(idx / W);
      const c = idx % W;
      const rc = renderGrid[r][c];
      const center = rc.center;
      const isPast = cell.date < todayStart;
      const dateKey = toDateKey(cell.date);
      const count = dateCountMap.get(dateKey) ?? 0;

      const centerBg = center > 0 ? countToHeatBg(center, maxCount) : undefined;
      const isRoomDate = highlightedDates.has(dateKey);
      const textColor =
        center > 0 && count / maxCount > 0.5
          ? "#fff"
          : isPast || !isRoomDate
            ? adaptive.grey400
            : adaptive.grey800;

      return {
        hidden: cell.hidden,
        day: cell.day,
        text: center > 0 ? String(count) : undefined,
        isToday: cell.isToday,
        textColor,
        center: centerBg,
        lt: countToHeatBg(rc.lt, maxCount),
        rt: countToHeatBg(rc.rt, maxCount),
        lb: countToHeatBg(rc.lb, maxCount),
        rb: countToHeatBg(rc.rb, maxCount),
      };
    });
  }, [cells, renderGrid, dateCountMap, maxCount]);

  const handleCellClick = useCallback(
    (idx: number) => {
      const cell = cells[idx];
      if (!cell) return;
      const key = toDateKey(cell.date);
      if (!highlightedDates.has(key)) return;
      onDateClick?.(key);
    },
    [cells, highlightedDates, onDateClick],
  );

  return (
    <CalendarGrid
      cells={calendarCells}
      onCellClick={handleCellClick}
    />
  );
}

export default function OverviewCalendarSheet() {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const { room, participants, weeks } = useRoomData(id);
  const isOverviewCalendarOpen = useRoomStore(
    (state) => state.isOverviewCalendarOpen,
  );
  const setIsOverviewCalendarOpen = useRoomStore(
    (state) => state.setIsOverviewCalendarOpen,
  );
  const setWeekIdx = useRoomStore((state) => state.setWeekIdx);
  const selectedUserId = useRoomStore((state) => state.selectedUserId);

  const filteredParticipants = useMemo(
    () =>
      selectedUserId
        ? participants.filter((p) => p.userId === selectedUserId)
        : participants,
    [participants, selectedUserId],
  );

  const maxCount = selectedUserId ? 1 : participants.length;

  const highlightedDates = useMemo(
    () => new Set(room?.dates ?? []),
    [room?.dates],
  );

  const calendarBaseDate = useMemo(() => {
    const dates = room?.dates ?? [];
    if (dates.length === 0) return new Date();
    const earliest = dates.reduce((min, d) => (d < min ? d : min), dates[0]);
    const [y, m, d] = earliest.split("-").map(Number);
    return new Date(y, m - 1, d);
  }, [room?.dates]);

  const dateCountMap = useMemo(() => {
    const map = new Map<string, Set<string>>();
    for (const p of filteredParticipants) {
      for (const slot of p.slots) {
        if (!map.has(slot.date)) {
          map.set(slot.date, new Set());
        }
        map.get(slot.date)?.add(p.name);
      }
    }
    const result = new Map<string, number>();
    for (const [date, names] of map) {
      result.set(date, names.size);
    }
    return result;
  }, [filteredParticipants]);

  const handleDateClick = useCallback(
    (dateKey: string) => {
      const targetIdx = weeks.findIndex((w) =>
        w.columns.some((col) => col.date === dateKey),
      );
      if (targetIdx !== -1) {
        setWeekIdx(targetIdx);
        setIsOverviewCalendarOpen(false);
      }
    },
    [weeks, setWeekIdx, setIsOverviewCalendarOpen],
  );

  return (
    <BottomSheet
      open={isOverviewCalendarOpen}
      onClose={() => setIsOverviewCalendarOpen(false)}
      header={
        <BottomSheet.Header>
          {t("overview.participationStatus")}
        </BottomSheet.Header>
      }
    >
      <HeatmapCalendarView
        baseDate={calendarBaseDate}
        highlightedDates={highlightedDates}
        dateCountMap={dateCountMap}
        maxCount={maxCount}
        onDateClick={handleDateClick}
      />
    </BottomSheet>
  );
}
