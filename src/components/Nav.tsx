import type { ReactElement } from "react";
import type { SiteKitPage } from "../types";
import { asNonEmptyString, isRecord } from "../utils";

export interface NavProps {
  pages: SiteKitPage[];
  currentPath: string;
  /** presby's own URL builder — this package never assumes a `/site/<slug>`
   * prefix, the same reasoning `imageUrl` already applies to asset links. */
  pageUrl: (path: string) => string;
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
 * the whole bundle's page list, not one page's own props. Renders nothing
 * at all with fewer than two navigable pages: a single-page site has
 * nothing meaningful to navigate between, the same "omit the section
 * entirely, never a blank placeholder" discipline `Footer` already follows.
 */
export function Nav({ pages, currentPath, pageUrl }: NavProps): ReactElement | null {
  const entries = navEntriesFor(pages);
  if (entries.length < 2) return null;

  return (
    <nav aria-label="Site" data-block="nav">
      <ul>
        {entries.map((entry) => (
          <li key={entry.path}>
            <a
              href={pageUrl(entry.path)}
              aria-current={entry.path === currentPath ? "page" : undefined}
            >
              {entry.label}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
