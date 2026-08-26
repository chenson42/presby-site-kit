import type { ReactElement } from "react";
import type { RenderSiteBundleProfile, ScheduleEntry } from "../types";
import { dayName, formatClockTime, mapsSearchUrl, sanitizeHref } from "../utils";
import { groupEntries, type NavEntry } from "./Nav";

export interface FooterProps {
  /** `null` renders nothing at all -- same null-safe-by-construction
   * discipline as `brand`. When non-null, every individual piece is
   * independently omitted when its own field is empty. */
  profile: RenderSiteBundleProfile | null;
  headingClassName?: string;
  /** The same grouped entries `Nav` renders as dropdowns render here as
   * link columns under each group's own heading -- one shared grouping,
   * two presentations, never two independent lists to keep in sync. */
  entries: NavEntry[];
  logoUrl: string | null;
  logoAlt: string;
  organizationName: string;
}

const SOCIAL_LABELS: Record<RenderSiteBundleProfile["socialLinks"][number]["platform"], string> = {
  facebook: "Facebook",
  instagram: "Instagram",
  xTwitter: "X (Twitter)",
  youtube: "YouTube",
  other: "Website",
};

const SOCIAL_ICON_PATHS: Record<RenderSiteBundleProfile["socialLinks"][number]["platform"], string> = {
  facebook:
    "M22 12a10 10 0 1 0-11.6 9.9v-7H7.9V12h2.5V9.8c0-2.5 1.5-3.9 3.8-3.9 1.1 0 2.2.2 2.2.2v2.4h-1.2c-1.2 0-1.6.8-1.6 1.6V12h2.8l-.4 2.9h-2.4v7A10 10 0 0 0 22 12Z",
  instagram:
    "M12 2c2.7 0 3.1 0 4.1.1 1.1 0 1.8.2 2.5.5.7.3 1.2.6 1.8 1.2.6.6.9 1.1 1.2 1.8.3.7.4 1.4.5 2.5.1 1 .1 1.4.1 4.1s0 3.1-.1 4.1c0 1.1-.2 1.8-.5 2.5-.3.7-.6 1.2-1.2 1.8-.6.6-1.1.9-1.8 1.2-.7.3-1.4.4-2.5.5-1 .1-1.4.1-4.1.1s-3.1 0-4.1-.1c-1.1 0-1.8-.2-2.5-.5-.7-.3-1.2-.6-1.8-1.2-.6-.6-.9-1.1-1.2-1.8-.3-.7-.4-1.4-.5-2.5C2 15.1 2 14.7 2 12s0-3.1.1-4.1c0-1.1.2-1.8.5-2.5.3-.7.6-1.2 1.2-1.8.6-.6 1.1-.9 1.8-1.2.7-.3 1.4-.4 2.5-.5C8.9 2 9.3 2 12 2Zm0 1.8c-2.6 0-3 0-4 .1-1 0-1.5.2-1.9.3-.5.2-.8.4-1.2.8-.4.4-.6.7-.8 1.2-.1.4-.3.9-.3 1.9-.1 1-.1 1.4-.1 4s0 3 .1 4c0 1 .2 1.5.3 1.9.2.5.4.8.8 1.2.4.4.7.6 1.2.8.4.1.9.3 1.9.3 1 .1 1.4.1 4 .1s3 0 4-.1c1 0 1.5-.2 1.9-.3.5-.2.8-.4 1.2-.8.4-.4.6-.7.8-1.2.1-.4.3-.9.3-1.9.1-1 .1-1.4.1-4s0-3-.1-4c0-1-.2-1.5-.3-1.9-.2-.5-.4-.8-.8-1.2-.4-.4-.7-.6-1.2-.8-.4-.1-.9-.3-1.9-.3-1-.1-1.4-.1-4-.1Zm0 3.5a4.7 4.7 0 1 1 0 9.4 4.7 4.7 0 0 1 0-9.4Zm0 1.8a2.9 2.9 0 1 0 0 5.8 2.9 2.9 0 0 0 0-5.8Zm4.9-2a1.1 1.1 0 1 1 0 2.2 1.1 1.1 0 0 1 0-2.2Z",
  xTwitter:
    "M18.9 2.5h3.2l-7 8 8.2 11h-6.4l-5-6.6-5.8 6.6H1.9l7.5-8.6-7.9-10.4h6.6l4.5 6.1 5.3-6.1Zm-1.1 17h1.7L7.2 4.4H5.4l12.4 15.1Z",
  youtube:
    "M23.5 6.2a3 3 0 0 0-2.1-2.1C19.5 3.5 12 3.5 12 3.5s-7.5 0-9.4.6A3 3 0 0 0 .5 6.2 31 31 0 0 0 0 12a31 31 0 0 0 .5 5.8 3 3 0 0 0 2.1 2.1c1.9.6 9.4.6 9.4.6s7.5 0 9.4-.6a3 3 0 0 0 2.1-2.1A31 31 0 0 0 24 12a31 31 0 0 0-.5-5.8ZM9.6 15.5V8.5l6.3 3.5-6.3 3.5Z",
  other:
    "M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20Zm6.9 6h-3a15 15 0 0 0-1.3-4A8.3 8.3 0 0 1 18.9 8ZM12 4.1c.7 1 1.6 2.4 2.1 3.9H9.9c.5-1.5 1.4-2.9 2.1-3.9ZM4.3 14a8 8 0 0 1 0-4h3.4a17 17 0 0 0 0 4Zm.8 2h3a15 15 0 0 0 1.3 4A8.3 8.3 0 0 1 5.1 16Zm3-8h-3a8.3 8.3 0 0 1 4.3-4 15 15 0 0 0-1.3 4Zm4 12c-.7-1-1.6-2.4-2.1-3.9h4.2c-.5 1.5-1.4 2.9-2.1 3.9ZM14.5 14h-5a13 13 0 0 1 0-4h5a13 13 0 0 1 0 4Zm.4 5.9c.5-1.2 1-2.6 1.3-4h3a8.3 8.3 0 0 1-4.3 4ZM16.4 14a17 17 0 0 0 0-4h3.4a8 8 0 0 1 0 4Z",
};

function worshipLine(entries: ScheduleEntry[]): string | null {
  if (entries.length === 0) return null;
  const first = entries[0];
  if (!first) return null;
  const days = [...new Set(entries.map((e) => e.dayOfWeek))].sort();
  const dayLabel =
    days.length === 1 && days[0] !== undefined
      ? `${dayName(days[0])}s`
      : days.map((d) => dayName(d)).join(", ");
  return `${dayLabel} ${formatClockTime(first.startTime)}`;
}

/**
 * Groups consecutive days sharing identical start/end times into one
 * readable range, e.g. four identical Monday-Thursday office-hours rows
 * collapse to "Monday–Thursday 9:00 AM–3:30 PM" rather than four lines.
 * Non-consecutive or differently-timed days each get their own line.
 */
function scheduleRuns(entries: ScheduleEntry[]): string[] {
  const sorted = [...entries].sort((a, b) => a.dayOfWeek - b.dayOfWeek);
  const lines: string[] = [];
  let i = 0;
  while (i < sorted.length) {
    const start = sorted[i];
    if (!start) break;
    let j = i;
    while (
      j + 1 < sorted.length &&
      sorted[j + 1]?.dayOfWeek === (sorted[j]?.dayOfWeek ?? -1) + 1 &&
      sorted[j + 1]?.startTime === start.startTime &&
      sorted[j + 1]?.endTime === start.endTime
    ) {
      j += 1;
    }
    const end = sorted[j];
    const dayLabel =
      j === i || !end
        ? dayName(start.dayOfWeek)
        : `${dayName(start.dayOfWeek)}–${dayName(end.dayOfWeek)}`;
    lines.push(`${dayLabel} ${formatClockTime(start.startTime)}–${formatClockTime(start.endTime)}`);
    i = j + 1;
  }
  return lines;
}

export function Footer({
  profile,
  headingClassName,
  entries,
  logoUrl,
  logoAlt,
  organizationName,
}: FooterProps): ReactElement | null {
  const { groups } = groupEntries(entries);
  if (!profile && groups.length === 0) return null;

  const directionsHref = profile?.address ? mapsSearchUrl(profile.address) : null;
  const phoneHref = profile?.phone ? sanitizeHref(`tel:${profile.phone}`) : null;
  const worship = profile ? worshipLine(profile.serviceTimes) : null;
  const officeHoursLines = profile ? scheduleRuns(profile.officeHours) : [];

  return (
    <footer data-block="footer">
      <div data-slot="footer-main">
        <div data-slot="footer-left">
          {logoUrl ? (
            <img data-slot="footer-logo" src={logoUrl} alt={logoAlt} />
          ) : (
            <p data-slot="footer-logo-text">{organizationName}</p>
          )}

          {profile?.address ? <p data-slot="address">{profile.address}</p> : null}
          {profile?.phone && phoneHref ? (
            <p data-slot="phone">
              <a href={phoneHref}>{profile.phone}</a>
            </p>
          ) : null}

          {worship || officeHoursLines.length > 0 ? (
            <div data-slot="schedules">
              {worship ? (
                <p>
                  <span data-slot="schedule-label">Worship:</span> {worship}
                </p>
              ) : null}
              {officeHoursLines.length > 0 ? (
                <p>
                  <span data-slot="schedule-label">Office hours:</span>{" "}
                  {officeHoursLines.join(", ")}
                </p>
              ) : null}
            </div>
          ) : null}

          {directionsHref ? (
            <a data-slot="directions-button" href={directionsHref}>
              Get directions
            </a>
          ) : null}
        </div>

        {groups.length > 0 ? (
          <div data-slot="footer-nav-groups">
            {groups.map(({ group, items }) => (
              <div key={group}>
                <h2 className={headingClassName}>{group}</h2>
                <ul>
                  {items.map((entry) => (
                    <li key={entry.path}>
                      <a href={entry.href}>{entry.label}</a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        ) : null}
      </div>

      <div data-slot="footer-bottom">
        <p>© {new Date().getUTCFullYear()} All rights reserved</p>

        {profile && profile.socialLinks.length > 0 ? (
          <nav aria-label="Social media" data-slot="social-links">
            <ul>
              {profile.socialLinks.flatMap((link, index) => {
                const href = sanitizeHref(link.url);
                if (!href) return [];
                return [
                  // eslint-disable-next-line react/no-array-index-key
                  <li key={index}>
                    <a href={href} target="_blank" rel="noopener noreferrer">
                      <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                        <path d={SOCIAL_ICON_PATHS[link.platform] ?? SOCIAL_ICON_PATHS.other} />
                      </svg>
                      <span className="sr-only">
                        {SOCIAL_LABELS[link.platform] ?? SOCIAL_LABELS.other}
                      </span>
                    </a>
                  </li>,
                ];
              })}
            </ul>
          </nav>
        ) : null}
      </div>
    </footer>
  );
}
