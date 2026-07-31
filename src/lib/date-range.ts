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
    // Start from Monday (0 = Sunday, 1 = Monday, etc.)
    const day = now.getDay();
    const diff = day === 0 ? 6 : day - 1; // Days to subtract to get to Monday
    start = new Date(now);
    start.setDate(start.getDate() - diff);
    start.setHours(0, 0, 0, 0);
    // End on Sunday
    end.setDate(start.getDate() + 6);
    end.setHours(23, 59, 59, 999);
  } else {
    start = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
    return { start, end: monthEnd };
  }

  return { start, end };
}

const VALID_PRESETS: RangePreset[] = ["today", "week", "month"];

export function startOfDay(value: string | Date) {
  const d = new Date(value);
  d.setHours(0, 0, 0, 0);
  return d;
}

export function endOfDay(value: string | Date) {
  const d = new Date(value);
  d.setHours(23, 59, 59, 999);
  return d;
}

/**
 * Rentang waktu dari query string: `startDate`/`endDate` bila ada, selain itu preset `range`.
 * Mengembalikan `error` bila preset tidak dikenal.
 */
export function resolveRangeParams(
  searchParams: URLSearchParams
): { range: RangePreset; start: Date; end: Date } | { error: string } {
  const range = (searchParams.get("range") ?? "today") as RangePreset;
  const startDate = searchParams.get("startDate");
  const endDate = searchParams.get("endDate");

  if (startDate) {
    return { range, start: startOfDay(startDate), end: endOfDay(endDate ?? startDate) };
  }

  if (!VALID_PRESETS.includes(range)) {
    return { error: "range tidak valid" };
  }

  return { range, ...getRangeBounds(range) };
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
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

/** Label bucket grafik untuk sebuah tanggal sesuai preset yang dipilih. */
export function formatChartKey(preset: RangePreset, d: Date) {
  if (preset === "today") return formatHourKey(d);
  if (preset === "month") return formatMonthKey(d);
  return formatDayKey(d);
}

/** Semua label bucket grafik dalam rentang, termasuk yang tanpa data. */
export function buildChartLabels(preset: RangePreset, start: Date, end: Date, now = new Date()) {
  if (preset === "today") {
    const dayKey = formatDayKey(start);
    return Array.from(
      { length: now.getHours() + 1 },
      (_, h) => `${dayKey} ${String(h).padStart(2, "0")}:00`
    );
  }

  if (preset === "month") {
    const year = start.getFullYear();
    return Array.from({ length: 12 }, (_, m) => `${year}-${String(m + 1).padStart(2, "0")}`);
  }

  const labels: string[] = [];
  const cursor = new Date(start);
  while (cursor <= end) {
    labels.push(formatDayKey(cursor));
    cursor.setDate(cursor.getDate() + 1);
  }
  return labels;
}
