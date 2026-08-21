import type { ReactElement } from "react";
import type { RenderSiteBundleProfile, ScheduleEntry } from "../types";
import { dayName, formatClockTime, mapsSearchUrl, sanitizeHref } from "../utils";

export interface FooterProps {
  /** `null` renders nothing at all — same null-safe-by-construction
   * discipline as `brand`. When non-null, every individual piece (address,
   * phone, service times, office hours, social links) is independently
   * omitted when its own field is empty; this per-field omissibility is a
   * hard requirement, not a nicety. */
  profile: RenderSiteBundleProfile | null;
  headingClassName?: string;
}

const SOCIAL_LABELS: Record<RenderSiteBundleProfile["socialLinks"][number]["platform"], string> = {
  facebook: "Facebook",
  instagram: "Instagram",
  xTwitter: "X (Twitter)",
  youtube: "YouTube",
  other: "Website",
};

function ScheduleList({
  heading,
  entries,
  headingClassName,
}: {
  heading: string;
  entries: ScheduleEntry[];
  headingClassName?: string;
}): ReactElement | null {
  if (entries.length === 0) return null;
  return (
    <div>
      <h2 className={headingClassName}>{heading}</h2>
      <ul>
        {entries.map((entry, index) => (
          // eslint-disable-next-line react/no-array-index-key
          <li key={index}>
            {entry.label ? `${entry.label} — ` : ""}
            {dayName(entry.dayOfWeek)} {formatClockTime(entry.startTime)}–
            {formatClockTime(entry.endTime)}
          </li>
        ))}
      </ul>
    </div>
  );
}

/**
 * Footer chrome, composed automatically by `renderSiteBundle()` below every
 * page's blocks — not a content block itself, since every page needs it.
 * Reads `profile` directly, the same as the `serviceTimes` block.
 */
export function Footer({ profile, headingClassName }: FooterProps): ReactElement | null {
  if (!profile) return null;

  const directionsHref = profile.address ? mapsSearchUrl(profile.address) : null;
  const phoneHref = profile.phone ? sanitizeHref(`tel:${profile.phone}`) : null;

  return (
    <footer data-block="footer">
      {profile.address ? (
        <div data-slot="address">
          <p>{profile.address}</p>
          {directionsHref ? <a href={directionsHref}>Get directions</a> : null}
        </div>
      ) : null}

      {profile.phone && phoneHref ? (
        <p data-slot="phone">
          <a href={phoneHref}>{profile.phone}</a>
        </p>
      ) : null}

      {profile.serviceTimes.length > 0 ? (
        <div data-slot="service-times">
          <ScheduleList
            heading="Service Times"
            entries={profile.serviceTimes}
            headingClassName={headingClassName}
          />
        </div>
      ) : null}

      {profile.officeHours.length > 0 ? (
        <div data-slot="office-hours">
          <ScheduleList
            heading="Office Hours"
            entries={profile.officeHours}
            headingClassName={headingClassName}
          />
        </div>
      ) : null}

      {profile.socialLinks.length > 0 ? (
        <nav aria-label="Social media" data-slot="social-links">
          <ul>
            {profile.socialLinks.flatMap((link, index) => {
              const href = sanitizeHref(link.url);
              if (!href) return [];
              return [
                // eslint-disable-next-line react/no-array-index-key
                <li key={index}>
                  <a href={href} target="_blank" rel="noopener noreferrer">
                    {SOCIAL_LABELS[link.platform] ?? SOCIAL_LABELS.other}
                  </a>
                </li>,
              ];
            })}
          </ul>
        </nav>
      ) : null}
    </footer>
  );
}
