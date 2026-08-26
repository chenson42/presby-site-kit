"use strict";
/**
 * Small, dependency-free defensive helpers shared by every block renderer
 * and component in this package. Nothing here parses HTML or touches
 * `dangerouslySetInnerHTML` — that boundary is the whole point of this
 * package (see DESIGN-v1-components.md).
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.isRecord = isRecord;
exports.asString = asString;
exports.asNonEmptyString = asNonEmptyString;
exports.asArray = asArray;
exports.sanitizeHref = sanitizeHref;
exports.asCta = asCta;
exports.dayName = dayName;
exports.formatClockTime = formatClockTime;
exports.formatEventDateTime = formatEventDateTime;
exports.mapsSearchUrl = mapsSearchUrl;
exports.asHexColor = asHexColor;
exports.toTrustedEmbedUrl = toTrustedEmbedUrl;
function isRecord(value) {
    return typeof value === "object" && value !== null && !Array.isArray(value);
}
function asString(value) {
    return typeof value === "string" ? value : null;
}
function asNonEmptyString(value) {
    const s = asString(value);
    return s !== null && s.trim().length > 0 ? s : null;
}
function asArray(value) {
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
function sanitizeHref(value) {
    const href = asNonEmptyString(value);
    if (href === null)
        return null;
    const trimmed = href.trim();
    if (trimmed.startsWith("/") || trimmed.startsWith("#"))
        return trimmed;
    try {
        const url = new URL(trimmed);
        return SAFE_HREF_PROTOCOLS.has(url.protocol) ? trimmed : null;
    }
    catch {
        return null;
    }
}
function asCta(value) {
    if (!isRecord(value))
        return null;
    const label = asNonEmptyString(value.label);
    const href = sanitizeHref(value.href);
    if (label === null || href === null)
        return null;
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
];
function dayName(dayOfWeek) {
    return DAY_NAMES[((dayOfWeek % 7) + 7) % 7] ?? "";
}
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
function formatClockTime(value) {
    const match = /^(\d{1,2}):(\d{2})(?::\d{2})?$/.exec(value.trim());
    if (!match)
        return value;
    const rawHour = Number(match[1]);
    const minute = match[2];
    if (Number.isNaN(rawHour) || rawHour > 23)
        return value;
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
function formatEventDateTime(iso) {
    const date = new Date(iso);
    if (Number.isNaN(date.getTime()))
        return null;
    return new Intl.DateTimeFormat("en-US", {
        dateStyle: "medium",
        timeStyle: "short",
        timeZone: "UTC",
    }).format(date);
}
function mapsSearchUrl(address) {
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;
}
/**
 * Strict `#rrggbb` validation for every content-authored color (callout
 * background/headingColor, prose headingColor, contact-form headingColor).
 * A content repo is a lower trust tier than presby's own code — this value
 * is interpolated into a CSS custom property, never handed to
 * `dangerouslySetInnerHTML`, but `#rrggbb` is still the only shape trusted
 * enough to skip escaping entirely. Anything else (a named color, `rgb()`,
 * a value with a trailing `;` or `}` attempting a CSS-injection breakout)
 * is rejected outright rather than sanitized.
 */
const HEX_COLOR_RE = /^#[0-9a-fA-F]{6}$/;
function asHexColor(value) {
    const s = asString(value);
    return s !== null && HEX_COLOR_RE.test(s) ? s : null;
}
/**
 * Trusted-allowlist video embed URL builder. A `SermonEmbed` block is
 * content-authored (a lower trust tier — see `sanitizeHref`'s own framing)
 * and its `embedUrl` prop is never passed through to an `<iframe src>`
 * as-is: it is parsed, matched against a closed host allowlist, its video
 * ID extracted and validated against a strict charset/length regex, and
 * the final `src` is REBUILT from those validated parts — never the
 * caller's original string. This is what makes it safe to render an
 * iframe from content-repo data at all: a query string, path traversal, or
 * an entirely different origin smuggled in past a naive `includes("youtube")`
 * check can never reach the DOM.
 *
 * Normalizes to the privacy-enhanced `youtube-nocookie.com` player and
 * `player.vimeo.com` — the same hosts presby's own CSP `frame-src`
 * allowlist expects (see presby's `next.config.ts`).
 */
const YT_VIDEO_ID_RE = /^[A-Za-z0-9_-]{5,20}$/;
const YT_LIST_ID_RE = /^[A-Za-z0-9_-]{10,60}$/;
const VIMEO_ID_RE = /^\d{4,20}$/;
const YOUTUBE_HOSTS = new Set([
    "www.youtube.com",
    "youtube.com",
    "youtu.be",
    "www.youtube-nocookie.com",
    "youtube-nocookie.com",
    "m.youtube.com",
]);
function toTrustedEmbedUrl(rawUrl) {
    const value = asNonEmptyString(rawUrl);
    if (value === null)
        return null;
    let url;
    try {
        url = new URL(value.trim());
    }
    catch {
        return null;
    }
    if (url.protocol !== "https:")
        return null;
    if (YOUTUBE_HOSTS.has(url.hostname)) {
        // A live-stream or "playlist" URL has no single video id — a playlist
        // param alone is still a legitimate, safe embed (the reference site's
        // own "watch past services" link is exactly this shape).
        const listId = url.searchParams.get("list");
        let videoId = null;
        if (url.hostname === "youtu.be") {
            videoId = url.pathname.slice(1).split("/")[0] || null;
        }
        else if (url.pathname.startsWith("/embed/")) {
            videoId = url.pathname.slice("/embed/".length).split("/")[0] || null;
        }
        else if (url.pathname === "/watch") {
            videoId = url.searchParams.get("v");
        }
        else if (url.pathname.startsWith("/live/")) {
            videoId = url.pathname.slice("/live/".length).split("/")[0] || null;
        }
        const validVideoId = videoId && YT_VIDEO_ID_RE.test(videoId) ? videoId : null;
        const validListId = listId && YT_LIST_ID_RE.test(listId) ? listId : null;
        if (!validVideoId && !validListId)
            return null;
        const embed = new URL(validVideoId
            ? `https://www.youtube-nocookie.com/embed/${validVideoId}`
            : "https://www.youtube-nocookie.com/embed/videoseries");
        if (validListId)
            embed.searchParams.set("list", validListId);
        return embed.toString();
    }
    if (url.hostname === "vimeo.com" || url.hostname === "player.vimeo.com") {
        const segments = url.pathname.split("/").filter(Boolean);
        const candidate = url.hostname === "player.vimeo.com"
            ? segments[segments.indexOf("video") + 1] ?? segments.at(-1)
            : segments.at(-1);
        if (!candidate || !VIMEO_ID_RE.test(candidate))
            return null;
        return `https://player.vimeo.com/video/${candidate}`;
    }
    return null;
}
