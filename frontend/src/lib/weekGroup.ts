export interface WeekColumn {
  date: string;
  storeColIdx: number;
}

export interface WeekGroup {
  sunday: string;
  columns: WeekColumn[];
}

function getSundayOf(dateStr: string): string {
  const d = new Date(`${dateStr}T00:00:00`);
  const day = d.getDay(); // 0=Sunday
  const sunday = new Date(d);
  sunday.setDate(d.getDate() - day);
  const y = sunday.getFullYear();
  const m = String(sunday.getMonth() + 1).padStart(2, "0");
  const dd = String(sunday.getDate()).padStart(2, "0");
  return `${y}-${m}-${dd}`;
}

export function groupDatesByWeek(dates: string[]): WeekGroup[] {
  const weekMap = new Map<string, WeekColumn[]>();
  const weekOrder: string[] = [];

  for (let i = 0; i < dates.length; i++) {
    const sunday = getSundayOf(dates[i]);
    if (!weekMap.has(sunday)) {
      weekMap.set(sunday, []);
      weekOrder.push(sunday);
    }
    weekMap.get(sunday)!.push({ date: dates[i], storeColIdx: i });
  }

  return weekOrder.map((sunday) => ({
    sunday,
    columns: weekMap.get(sunday)!,
  }));
}
