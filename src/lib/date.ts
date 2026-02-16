const LIMA_TZ = "America/Lima";

export function toLima(date: Date): string {
  return date.toLocaleString("es-PE", { timeZone: LIMA_TZ });
}

export function nowLima(): Date {
  const now = new Date();
  const limaStr = now.toLocaleString("en-US", { timeZone: LIMA_TZ });
  return new Date(limaStr);
}

export function startOfDayLima(date?: Date): Date {
  const d = date ? new Date(date) : nowLima();
  const limaStr = d.toLocaleDateString("en-US", { timeZone: LIMA_TZ });
  const limaDate = new Date(limaStr);
  // Convert back: Lima is UTC-5
  return new Date(limaDate.getTime() + 5 * 60 * 60 * 1000);
}

export function endOfDayLima(date?: Date): Date {
  const start = startOfDayLima(date);
  return new Date(start.getTime() + 24 * 60 * 60 * 1000 - 1);
}

export function startOfWeekLima(): Date {
  const now = nowLima();
  const day = now.getDay(); // 0=Sunday
  const monday = new Date(now);
  monday.setDate(now.getDate() - ((day + 6) % 7));
  return startOfDayLima(monday);
}

export function startOfMonthLima(): Date {
  const now = nowLima();
  const first = new Date(now.getFullYear(), now.getMonth(), 1);
  return startOfDayLima(first);
}

export function formatSoles(amount: number | string): string {
  const num = typeof amount === "string" ? parseFloat(amount) : amount;
  return `S/ ${num.toFixed(2)}`;
}

export function formatDateLima(date: Date): string {
  return date.toLocaleDateString("es-PE", {
    timeZone: LIMA_TZ,
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

export function formatDateTimeLima(date: Date): string {
  return date.toLocaleString("es-PE", {
    timeZone: LIMA_TZ,
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
