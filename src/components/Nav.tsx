"use client";

import { useState, type ReactElement } from "react";

export interface NavEntry {
  path: string;
  label: string;
  href: string;
}

export interface NavProps {
  /**
   * Already resolved by the caller (`renderSiteBundle()`) — a plain
   * `{ path, label, href }` per page whose `frontMatter.navLabel` is set,
   * `href` already run through `pageUrl`. `Nav` is a client component (see
   * below), so it can only receive serializable props across that
   * boundary — a `pageUrl: (path: string) => string` closure, which this
   * component took directly before it needed real open/closed state,
   * cannot cross it. Resolving here instead, once, server-side, is also
   * simpler than re-deriving the same list in two places.
   */
  entries: NavEntry[];
  currentPath: string;
  /**
   * The member portal's own sign-in entry point (presby's `/o/<slug>`) —
   * `null`-safe by construction like `brand`/`profile`. An unauthenticated
   * visitor hitting this URL is presby's own Edge gate's job to bounce to
   * sign-in with the right callback — this package only ever links to it,
   * never decides who's signed in.
   */
  portalUrl: string | null;
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
 *
 * A client component, the one in this whole package — every other piece is
 * a pure server-rendered function. The narrow-viewport collapse (below
 * `styles.css`'s 640px breakpoint) needs real open/closed state and a real
 * `<button>` with `aria-expanded`; the CSS-only checkbox-hack alternative
 * gives up correct AT semantics to avoid this one "use client", and this
 * package is trusted first-party code, not a content repo's — the same
 * trust boundary DESIGN-v1-components.md draws for *content* has nothing
 * to say about this file. Outside the breakpoint the toggle button is
 * simply hidden by CSS and the page-link list renders exactly as before.
 */
export function Nav({ entries, currentPath, portalUrl }: NavProps): ReactElement | null {
  const [open, setOpen] = useState(false);
  const showPageLinks = entries.length >= 2;
  if (!showPageLinks && !portalUrl) return null;

  return (
    <nav aria-label="Site" data-block="nav">
      <div data-slot="bar">
        <button
          type="button"
          data-slot="menu-toggle"
          aria-expanded={open}
          aria-controls="site-nav-menu"
          aria-label={open ? "Close menu" : "Open menu"}
          onClick={() => setOpen((value) => !value)}
        >
          <span />
          <span />
          <span />
        </button>
      </div>
      <ul id="site-nav-menu" data-open={open ? "true" : "false"}>
        {showPageLinks
          ? entries.map((entry) => (
              <li key={entry.path}>
                <a
                  href={entry.href}
                  aria-current={entry.path === currentPath ? "page" : undefined}
                  onClick={() => setOpen(false)}
                >
                  {entry.label}
                </a>
              </li>
            ))
          : null}
        {portalUrl ? (
          <li data-slot="portal-login">
            <a href={portalUrl} onClick={() => setOpen(false)}>
              Member Login
            </a>
          </li>
        ) : null}
      </ul>
    </nav>
  );
}
