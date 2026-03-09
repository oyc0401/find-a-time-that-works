import { format } from "date-fns";

const TOTAL_CELLS = 35;
const W = 7;
const H = 5;

export interface CalendarCell {
  date: Date;
  day: number;
  isCurrentMonth: boolean;
  hidden: boolean;
  isToday: boolean;
}

export function buildCalendarCells(baseDate: Date): CalendarCell[] {
  const today = new Date();
  const todayYear = today.getFullYear();
  const todayMonth = today.getMonth();
  const todayDate = today.getDate();

  // baseDate가 속한 주의 일요일부터 시작
  const weekStart = new Date(baseDate);
  weekStart.setDate(baseDate.getDate() - baseDate.getDay());

  const allCells: CalendarCell[] = [];

  for (let i = 0; i < TOTAL_CELLS; i++) {
    const date = new Date(weekStart);
    date.setDate(weekStart.getDate() + i);

    allCells.push({
      date,
      day: date.getDate(),
      isCurrentMonth:
        date.getFullYear() === todayYear && date.getMonth() === todayMonth,
      hidden: false,
      isToday:
        date.getFullYear() === todayYear &&
        date.getMonth() === todayMonth &&
        date.getDate() === todayDate,
    });
  }

  return allCells;
}

export function getSelectedDates(
  confirmed: boolean[][],
  cells: CalendarCell[],
): string[] {
  const dates: string[] = [];
  for (let r = 0; r < H; r++) {
    for (let c = 0; c < W; c++) {
      if (confirmed[r][c]) {
        const cell = cells[r * W + c];
        dates.push(format(cell.date, "yyyy-MM-dd"));
      }
    }
  }
  return dates;
}
