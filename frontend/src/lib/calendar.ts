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

export function buildCalendarCells(): CalendarCell[] {
  const today = new Date();
  const year = today.getFullYear();
  const month = today.getMonth();
  const todayDate = today.getDate();

  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const allCells: CalendarCell[] = [];

  // prev month placeholders
  const prevMonthDays = new Date(year, month, 0).getDate();
  for (let i = firstDay - 1; i >= 0; i--) {
    const day = prevMonthDays - i;
    allCells.push({
      date: new Date(year, month - 1, day),
      day,
      isCurrentMonth: false,
      hidden: true,
      isToday: false,
    });
  }

  // current month
  for (let d = 1; d <= daysInMonth; d++) {
    allCells.push({
      date: new Date(year, month, d),
      day: d,
      isCurrentMonth: true,
      hidden: d < todayDate,
      isToday: d === todayDate,
    });
  }

  // count fully hidden leading rows
  let hiddenRows = 0;
  for (let row = 0; row < H; row++) {
    const rowCells = allCells.slice(row * W, row * W + W);
    if (rowCells.length === W && rowCells.every((c) => c.hidden))
      hiddenRows++;
    else break;
  }

  const trimmed = allCells.slice(hiddenRows * W);

  // fill next month
  let nextDay = 1;
  while (trimmed.length < TOTAL_CELLS) {
    trimmed.push({
      date: new Date(year, month + 1, nextDay),
      day: nextDay++,
      isCurrentMonth: false,
      hidden: false,
      isToday: false,
    });
  }

  return trimmed.slice(0, TOTAL_CELLS);
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
