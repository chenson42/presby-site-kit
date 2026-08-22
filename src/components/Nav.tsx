import type { ReactElement } from "react";
import type { SiteKitPage } from "../types";
import { asNonEmptyString, isRecord } from "../utils";

export interface NavProps {
  pages: SiteKitPage[];
  currentPath: string;
  /** presby's own URL builder — this package never assumes a `/site/<slug>`
   * prefix, the same reasoning `imageUrl` already applies to asset links. */
  pageUrl: (path: string) => string;
  /**
   * The member portal's own sign-in entry point (presby's `/o/<slug>`) —
   * `null`-safe by construction like `brand`/`profile`, and a genuinely
   * different URL scheme than `pageUrl` builds, so this package takes it as
   * a plain string rather than trying to derive it from `pageUrl` itself.
   * An unauthenticated visitor hitting this URL is presby's own Edge gate's
   * job to bounce to sign-in with the right callback — this package only
   * ever links to it, never decides who's signed in.
   */
  portalUrl: string | null;
}

interface NavEntry {
  path: string;
  label: string;
}

/** A page opts into nav by setting `frontMatter.navLabel` to a non-empty
 * string, in whatever order the bundle's own `pages` array lists them —
 * this package never reorders or infers an order from `path`. */
function navEntriesFor(pages: SiteKitPage[]): NavEntry[] {
  return pages.flatMap((page) => {
    const label = isRecord(page.frontMatter)
      ? asNonEmptyString(page.frontMatter.navLabel)
      : null;
    return label ? [{ path: page.path, label }] : [];
  });
}

/**
 * Top navigation chrome, composed automatically by `renderSiteBundle()`
 * above every page's blocks — not a content block itself, since it needs
 * the whole bundle's page list, not one page's own props.
 *
 * Two independently-gated pieces: the page links (nothing at all with fewer
 * than two navigable pages — a single-page site has nothing meaningful to
 * navigate between, the same "omit the section entirely, never a blank
 * placeholder" discipline `Footer` already follows) and the member-portal
 * login link (shown whenever `portalUrl` is set, regardless of how many
 * public pages exist — a one-page site still has members who need to sign
 * in). The whole element renders `null` only when both are absent.
 */
export function Nav({ pages, currentPath, pageUrl, portalUrl }: NavProps): ReactElement | null {
  const entries = navEntriesFor(pages);
  const showPageLinks = entries.length >= 2;
  if (!showPageLinks && !portalUrl) return null;

  return (
    <nav aria-label="Site" data-block="nav">
      <ul>
        {showPageLinks
          ? entries.map((entry) => (
              <li key={entry.path}>
                <a
                  href={pageUrl(entry.path)}
                  aria-current={entry.path === currentPath ? "page" : undefined}
                >
                  {entry.label}
                </a>
              </li>
            ))
          : null}
        {portalUrl ? (
          <li data-slot="portal-login">
            <a href={portalUrl}>Member Login</a>
          </li>
        ) : null}
      </ul>
    </nav>
  );
}
