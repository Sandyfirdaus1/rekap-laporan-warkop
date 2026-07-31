export type RangePreset = "today" | "week" | "month" | "year";

export function getRangeBounds(preset: RangePreset, inputNow = new Date()) {
  // Selalu gunakan WIB (+07:00) sebagai referensi waktu
  const wibDateString = inputNow.toLocaleString("en-US", { timeZone: "Asia/Jakarta" });
  const wibNow = new Date(wibDateString);
  const y = wibNow.getFullYear();
  const m = wibNow.getMonth();
  const d = wibNow.getDate();

  const toUTC = (year: number, month: number, date: number, h: number, min: number, s: number, ms: number) => {
    // Bangun string ISO yang berzona +07:00 lalu parse ke UTC Date
    const pad = (n: number) => String(n).padStart(2, '0');
    return new Date(`${year}-${pad(month + 1)}-${pad(date)}T${pad(h)}:${pad(min)}:${pad(s)}.${String(ms).padStart(3, '0')}+07:00`);
  };

  const end = toUTC(y, m, d, 23, 59, 59, 999);
  let start: Date;

  if (preset === "today") {
    start = toUTC(y, m, d, 0, 0, 0, 0);
  } else if (preset === "week") {
    const day = wibNow.getDay();
    const diff = day === 0 ? 6 : day - 1; // Start from Monday
    const startWib = new Date(wibNow);
    startWib.setDate(startWib.getDate() - diff);
    start = toUTC(startWib.getFullYear(), startWib.getMonth(), startWib.getDate(), 0, 0, 0, 0);
    // End on Sunday is already handled by end if we want up to current day, but usually "week" means full week.
    // However, keeping end as end of today is safer, or end of week:
    const endWib = new Date(startWib);
    endWib.setDate(endWib.getDate() + 6);
    end.setTime(toUTC(endWib.getFullYear(), endWib.getMonth(), endWib.getDate(), 23, 59, 59, 999).getTime());
  } else if (preset === "month") {
    start = toUTC(y, m, 1, 0, 0, 0, 0);
    const lastDay = new Date(y, m + 1, 0).getDate();
    end.setTime(toUTC(y, m, lastDay, 23, 59, 59, 999).getTime());
  } else {
    start = toUTC(y, 0, 1, 0, 0, 0, 0);
    end.setTime(toUTC(y, 11, 31, 23, 59, 59, 999).getTime());
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
