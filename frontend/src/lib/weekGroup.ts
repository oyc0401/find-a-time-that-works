export interface WeekColumn {
  date: string;
  storeColIdx: number;
}

export interface WeekGroup {
  monday: string;
  columns: WeekColumn[];
}

function getMondayOf(dateStr: string): string {
  const d = new Date(`${dateStr}T00:00:00`);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  const monday = new Date(d);
  monday.setDate(d.getDate() + diff);
  const y = monday.getFullYear();
  const m = String(monday.getMonth() + 1).padStart(2, "0");
  const dd = String(monday.getDate()).padStart(2, "0");
  return `${y}-${m}-${dd}`;
}

export function groupDatesByWeek(dates: string[]): WeekGroup[] {
  const weekMap = new Map<string, WeekColumn[]>();
  const weekOrder: string[] = [];

  for (let i = 0; i < dates.length; i++) {
    const monday = getMondayOf(dates[i]);
    if (!weekMap.has(monday)) {
      weekMap.set(monday, []);
      weekOrder.push(monday);
    }
    weekMap.get(monday)!.push({ date: dates[i], storeColIdx: i });
  }

  return weekOrder.map((monday) => ({
    monday,
    columns: weekMap.get(monday)!,
  }));
}
