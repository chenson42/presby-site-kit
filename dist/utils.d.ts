/**
 * Small, dependency-free defensive helpers shared by every block renderer
 * and component in this package. Nothing here parses HTML or touches
 * `dangerouslySetInnerHTML` — that boundary is the whole point of this
 * package (see DESIGN-v1-components.md).
 */
export declare function isRecord(value: unknown): value is Record<string, unknown>;
export declare function asString(value: unknown): string | null;
export declare function asNonEmptyString(value: unknown): string | null;
export declare function asArray(value: unknown): unknown[];
/**
 * Rejects anything but an http(s)/mailto/tel absolute URL or a same-site
 * relative/hash path — in particular `javascript:` and other script-bearing
 * schemes never reach an `<a href>` this package renders. Applied uniformly
 * to every href this package emits, whether authored as a block prop or
 * discovered inside `Prose` markdown, because a content repo is a lower
 * trust tier than presby's own code (DESIGN-v1-components.md's own framing
 * for why blocks replace MDX applies just as much to a single attribute).
 */
export declare function sanitizeHref(value: unknown): string | null;
export interface Cta {
    label: string;
    href: string;
}
export declare function asCta(value: unknown): Cta | null;
export declare function dayName(dayOfWeek: number): string;
/**
 * Formats a 24-hour wall-clock string, "HH:MM" or "HH:MM:SS", e.g. "10:15"
 * or "10:15:00" -> "10:15 AM". Deliberately NOT a `Date`/`toLocale*` path: a
 * schedule entry is a clock time with no associated calendar date or
 * timezone, so routing it through `Date` would invent both and risk exactly
 * the drift class presby's own CLAUDE.md documents for calendar dates
 * ("never call toLocale*() directly"). A malformed value renders as-is
 * rather than throwing.
 *
 * The `:SS` suffix is accepted (and discarded) because it's the real shape
 * Postgres's own `time` column type serializes as — presby's
 * `presby_published_site()` returns `organization_service_times.start_time`
 * exactly this way, confirmed live against the real function during this
 * package's own end-to-end verification, not assumed from either side's
 * unit tests alone. Seconds precision has no display purpose for a
 * congregation's schedule; this is a real input shape to accept, not a
 * lossy simplification.
 */
export declare function formatClockTime(value: string): string;
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
export declare function formatEventDateTime(iso: string): string | null;
export declare function mapsSearchUrl(address: string): string;
