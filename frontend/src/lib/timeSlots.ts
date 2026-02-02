export function generateTimeSlots(
  startTime: string,
  endTime: string,
): string[] {
  const startH = Number.parseInt(startTime.split(":")[0]);
  const endH = Number.parseInt(endTime.split(":")[0]);
  const slots: string[] = [];
  for (let h = startH; h < endH; h++) {
    slots.push(`${String(h).padStart(2, "0")}:00`);
    slots.push(`${String(h).padStart(2, "0")}:30`);
  }
  return slots;
}

export function formatDateHeader(dateStr: string, weekdays: string[]) {
  const d = new Date(`${dateStr}T00:00:00`);
  const dayOfWeek = d.getDay();
  return {
    weekday: weekdays[dayOfWeek],
    label: `${d.getMonth() + 1}/${d.getDate()}`,
    day: `${d.getDate()}`,
    dayOfWeek,
  };
}
