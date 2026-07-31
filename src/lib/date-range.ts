export type RangePreset = "today" | "week" | "month" | "year";

/** Batas rentang waktu untuk filter (lokal server / deployment). Untuk WIB konsisten, set TZ di hosting atau gunakan offset tetap. */
export function getRangeBounds(preset: RangePreset, now = new Date()) {
  const end = new Date(now);
  end.setHours(23, 59, 59, 999);

  let start: Date;

  if (preset === "today") {
    start = new Date(now);
    start.setHours(0, 0, 0, 0);
  } else if (preset === "week") {
    // Start from Monday (0 = Sunday, 1 = Monday, etc.)
    const day = now.getDay();
    const diff = day === 0 ? 6 : day - 1; // Days to subtract to get to Monday
    start = new Date(now);
    start.setDate(start.getDate() - diff);
    start.setHours(0, 0, 0, 0);
    // End on Sunday
    end.setDate(start.getDate() + 6);
    end.setHours(23, 59, 59, 999);
  } else if (preset === "month") {
    start = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
    return { start, end: monthEnd };
  } else {
    start = new Date(now.getFullYear(), 0, 1, 0, 0, 0, 0);
    const yearEnd = new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999);
    return { start, end: yearEnd };
  }

  return { start, end };
}

export function formatDayKey(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function formatHourKey(d: Date) {
  return `${formatDayKey(d)} ${String(d.getHours()).padStart(2, "0")}:00`;
}

export function formatMonthKey(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  return `${y}-${m}`;
}
