// Board dates are plain calendar dates (stored as DATE → midnight UTC),
// so always format them in UTC to avoid off-by-one days.

type DateLike = Date | string | null | undefined;

function toDate(value: DateLike): Date | null {
  if (!value) return null;
  const d = typeof value === "string" ? new Date(value) : value;
  return Number.isNaN(d.getTime()) ? null : d;
}

/** "2026-12-01" for <input type="date"> */
export function toDateInputValue(value: DateLike): string {
  const d = toDate(value);
  return d ? d.toISOString().slice(0, 10) : "";
}

/** "1 Dec – 14 Jan 2027", "from 1 Dec 2026", "until 14 Jan 2027", or null */
export function formatDateRange(
  start: DateLike,
  end: DateLike,
  locale: string,
  labels: { from: string; until: string },
): string | null {
  const s = toDate(start);
  const e = toDate(end);
  if (!s && !e) return null;
  const full: Intl.DateTimeFormatOptions = {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  };
  const fmt = (d: Date, opts: Intl.DateTimeFormatOptions) =>
    new Intl.DateTimeFormat(locale, opts).format(d);
  if (s && e) {
    const sameYear = s.getUTCFullYear() === e.getUTCFullYear();
    const startText = fmt(s, sameYear ? { day: "numeric", month: "short", timeZone: "UTC" } : full);
    return `${startText} – ${fmt(e, full)}`;
  }
  if (s) return `${labels.from} ${fmt(s, full)}`;
  return `${labels.until} ${fmt(e as Date, full)}`;
}
