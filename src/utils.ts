/**
 * Small, dependency-free defensive helpers shared by every block renderer
 * and component in this package. Nothing here parses HTML or touches
 * `dangerouslySetInnerHTML` — that boundary is the whole point of this
 * package (see DESIGN-v1-components.md).
 */

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function asString(value: unknown): string | null {
  return typeof value === "string" ? value : null;
}

export function asNonEmptyString(value: unknown): string | null {
  const s = asString(value);
  return s !== null && s.trim().length > 0 ? s : null;
}

export function asArray(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

const SAFE_HREF_PROTOCOLS = new Set(["http:", "https:", "mailto:", "tel:"]);

/**
 * Rejects anything but an http(s)/mailto/tel absolute URL or a same-site
 * relative/hash path — in particular `javascript:` and other script-bearing
 * schemes never reach an `<a href>` this package renders. Applied uniformly
 * to every href this package emits, whether authored as a block prop or
 * discovered inside `Prose` markdown, because a content repo is a lower
 * trust tier than presby's own code (DESIGN-v1-components.md's own framing
 * for why blocks replace MDX applies just as much to a single attribute).
 */
export function sanitizeHref(value: unknown): string | null {
  const href = asNonEmptyString(value);
  if (href === null) return null;
  const trimmed = href.trim();
  if (trimmed.startsWith("/") || trimmed.startsWith("#")) return trimmed;
  try {
    const url = new URL(trimmed);
    return SAFE_HREF_PROTOCOLS.has(url.protocol) ? trimmed : null;
  } catch {
    return null;
  }
}

export interface Cta {
  label: string;
  href: string;
}

export function asCta(value: unknown): Cta | null {
  if (!isRecord(value)) return null;
  const label = asNonEmptyString(value.label);
  const href = sanitizeHref(value.href);
  if (label === null || href === null) return null;
  return { label, href };
}

const DAY_NAMES = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
] as const;

export function dayName(dayOfWeek: number): string {
  return DAY_NAMES[((dayOfWeek % 7) + 7) % 7] ?? "";
}

/**
 * Formats a plain "HH:MM" 24-hour wall-clock string, e.g. "10:15" ->
 * "10:15 AM". Deliberately NOT a `Date`/`toLocale*` path: a schedule entry
 * is a clock time with no associated calendar date or timezone, so routing
 * it through `Date` would invent both and risk exactly the drift class
 * presby's own CLAUDE.md documents for calendar dates ("never call
 * toLocale*() directly"). A malformed value renders as-is rather than
 * throwing.
 */
export function formatClockTime(value: string): string {
  const match = /^(\d{1,2}):(\d{2})$/.exec(value.trim());
  if (!match) return value;
  const rawHour = Number(match[1]);
  const minute = match[2];
  if (Number.isNaN(rawHour) || rawHour > 23) return value;
  const suffix = rawHour >= 12 ? "PM" : "AM";
  const hour12 = rawHour % 12 === 0 ? 12 : rawHour % 12;
  return `${hour12}:${minute} ${suffix}`;
}

/**
 * Formats an ISO 8601 instant for display, fixed to UTC explicitly — not
 * the server's local timezone, and not `toLocale*`'s implicit environment
 * timezone — so the same event renders identically regardless of where
 * presby's server process happens to run. Unlike a schedule entry, an event
 * `startsAt`/`endsAt` is a caller-supplied instant, not a timezone-less
 * wall-clock time, so `Date` is the right tool here — just pinned to a
 * fixed, explicit `timeZone`. Returns `null` for an unparseable value so
 * the caller can omit the line entirely rather than print "Invalid Date".
 */
export function formatEventDateTime(iso: string): string | null {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return null;
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "UTC",
  }).format(date);
}

export function mapsSearchUrl(address: string): string {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;
}
