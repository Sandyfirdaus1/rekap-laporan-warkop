export type RangePreset = "today" | "week" | "month";

/** Batas rentang waktu untuk filter (lokal server / deployment). Untuk WIB konsisten, set TZ di hosting atau gunakan offset tetap. */
export function getRangeBounds(preset: RangePreset, now = new Date()) {
  const end = new Date(now);
  end.setHours(23, 59, 59, 999);

  let start: Date;

  if (preset === "today") {
    start = new Date(now);
    start.setHours(0, 0, 0, 0);
  } else if (preset === "week") {
    start = new Date(now);
    start.setDate(start.getDate() - 6);
    start.setHours(0, 0, 0, 0);
  } else {
    start = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
    return { start, end: monthEnd };
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
