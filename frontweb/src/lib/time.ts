const WEEKDAYS = ["일", "월", "화", "수", "목", "금", "토"];

function parseTime(time: string): number {
  const [hourStr, minuteStr] = time.split(":");
  return Number(hourStr) * 60 + Number(minuteStr);
}

function formatTime(minutes: number): string {
  const hour = Math.floor(minutes / 60)
    .toString()
    .padStart(2, "0");
  const minute = (minutes % 60).toString().padStart(2, "0");
  return `${hour}:${minute}`;
}

export function generateTimeSlots(startTime: string, endTime: string): string[] {
  const slots: string[] = [];
  let current = parseTime(startTime);
  const end = parseTime(endTime);

  while (current < end) {
    slots.push(formatTime(current));
    current += 30;
  }

  return slots;
}

export function formatDateLabel(dateStr: string) {
  const date = new Date(`${dateStr}T00:00:00`);
  const month = date.getMonth() + 1;
  const day = date.getDate();
  return {
    label: `${month.toString().padStart(2, "0")}.${day
      .toString()
      .padStart(2, "0")}`,
    weekday: WEEKDAYS[date.getDay()],
    full: date.toLocaleDateString("ko-KR", {
      month: "long",
      day: "numeric",
      weekday: "short",
    }),
  };
}
