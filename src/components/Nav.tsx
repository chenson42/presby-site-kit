"use client";

import { useEffect, useRef, useState, type ReactElement } from "react";
import { groupEntries } from "../nav-grouping";

export interface NavEntry {
  path: string;
  label: string;
  href: string;
  /**
   * A dropdown group name ("Visit", "Connect", "Serve" for the reference
   * site) -- entries sharing a group render under one hover-opening
   * `<details>` in `Nav` and one link column in `Footer`. `null` is a
   * top-level, ungrouped item (the reference's own "Home").
   */
  group: string | null;
  /** Renders as a filled pill button rather than a plain link -- the
   * reference site's own "Give" link. */
  highlight: boolean;
}

export interface NavProps {
  entries: NavEntry[];
  currentPath: string;
  portalUrl: string | null;
  /** An already-resolved logo image URL, or `null` for the typographic
   * fallback (the caller's own org name, same null-safe discipline as
   * `brand`). */
  logoUrl: string | null;
  logoAlt: string;
  organizationName: string;
  organizationHomeUrl: string;
  /** The reference site's own "Join us Sundays at 10:15 AM" line -- shown
   * inline with the menu at wide viewports, omitted entirely when unset. */
  promoText: string | null;
}



/**
 * Top navigation chrome. Two independently-gated pieces, same discipline as
 * before: the page links (nothing with fewer than two navigable entries)
 * and the member-portal login link. The whole element renders `null` only
 * when both are absent AND there's no logo/org name to show (a page with
 * zero nav entries and no portal link still needs its own home link).
 *
 * Grouped entries (`group` non-null) render as a `<details>` dropdown,
 * opened two ways: hover, via a REAL DOM `open` attribute toggled by
 * `onPointerEnter`/`onPointerLeave` gated to `pointerType === "mouse"`
 * (never a CSS `:hover` rule -- Chromium applies `content-visibility` to
 * `::details-content`, which hides a CLOSED `<details>`'s content from
 * author CSS entirely; a `:hover`-only reveal computes as visible but
 * paints nothing, a gap that only shows up in a real screenshot, not a
 * computed-style check); and click/tap, which flips `open` directly and
 * is what makes the same markup work with no pointer at all.
 */
export function Nav({
  entries,
  currentPath,
  portalUrl,
  logoUrl,
  logoAlt,
  organizationName,
  organizationHomeUrl,
  promoText,
}: NavProps): ReactElement | null {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [openGroup, setOpenGroup] = useState<string | null>(null);
  const [hidden, setHidden] = useState(false);
  const lastScrollY = useRef(0);

  useEffect(() => {
    lastScrollY.current = window.scrollY;
    const onScroll = () => {
      const y = window.scrollY;
      const goingDown = y > lastScrollY.current;
      // Never hide near the top -- a nav that vanishes before the visitor
      // has scrolled anywhere reads as broken, not "smart."
      setHidden(goingDown && y > 160);
      lastScrollY.current = y;
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const { top, groups } = groupEntries(entries);
  // A `highlight` entry (the reference's own "Give" pill button) is a
  // call-to-action, not a peer of the regular top-level links -- the
  // reference always renders it LAST, after every dropdown group, however
  // its own navOrder sorts among the flat entry list. An ordinary
  // (non-highlight) ungrouped entry keeps rendering before the groups.
  const topLeading = top.filter((entry) => !entry.highlight);
  const topTrailing = top.filter((entry) => entry.highlight);
  const showPageLinks = entries.length >= 2;
  if (!showPageLinks && !portalUrl && !logoUrl) return null;

  return (
    <nav aria-label="Site" data-block="nav" data-hidden={hidden ? "true" : "false"}>
      <div data-slot="bar">
        <a href={organizationHomeUrl} data-slot="logo">
          {logoUrl ? (
            <img src={logoUrl} alt={logoAlt} />
          ) : (
            <span data-slot="logo-text">{organizationName}</span>
          )}
        </a>

        <div data-slot="menu-region">
          {promoText ? <p data-slot="promo">{promoText}</p> : null}

          {showPageLinks || portalUrl ? (
            <button
              type="button"
              data-slot="menu-toggle"
              aria-expanded={mobileOpen}
              aria-controls="site-nav-menu"
              aria-label={mobileOpen ? "Close menu" : "Open menu"}
              onClick={() => setMobileOpen((value) => !value)}
            >
              <span />
              <span />
              <span />
            </button>
          ) : null}

          <ul id="site-nav-menu" data-open={mobileOpen ? "true" : "false"}>
            {topLeading.map((entry) => (
              <li key={entry.path} data-highlight="false">
                <a
                  href={entry.href}
                  aria-current={entry.path === currentPath ? "page" : undefined}
                  onClick={() => setMobileOpen(false)}
                >
                  {entry.label}
                </a>
              </li>
            ))}

            {groups.map(({ group, items }) => (
              <li key={group}>
                <details
                  open={openGroup === group}
                  onPointerEnter={(event) => {
                    if (event.pointerType === "mouse") setOpenGroup(group);
                  }}
                  onPointerLeave={(event) => {
                    if (event.pointerType === "mouse") setOpenGroup(null);
                  }}
                >
                  <summary
                    onClick={(event) => {
                      // The pointer handlers above already own hover; a
                      // click toggles independently, for touch and
                      // keyboard, without fighting the hover state.
                      event.preventDefault();
                      setOpenGroup((current) => (current === group ? null : group));
                    }}
                  >
                    {group}
                  </summary>
                  <ul>
                    {items.map((entry) => (
                      <li key={entry.path}>
                        <a
                          href={entry.href}
                          aria-current={entry.path === currentPath ? "page" : undefined}
                          onClick={() => {
                            setMobileOpen(false);
                            setOpenGroup(null);
                          }}
                        >
                          {entry.label}
                        </a>
                      </li>
                    ))}
                  </ul>
                </details>
              </li>
            ))}

            {topTrailing.map((entry) => (
              <li key={entry.path} data-highlight="true">
                <a
                  href={entry.href}
                  aria-current={entry.path === currentPath ? "page" : undefined}
                  onClick={() => setMobileOpen(false)}
                >
                  {entry.label}
                </a>
              </li>
            ))}

            {portalUrl ? (
              <li data-slot="portal-login">
                <a href={portalUrl} onClick={() => setMobileOpen(false)}>
                  Member Login
                </a>
              </li>
            ) : null}
          </ul>
        </div>
      </div>
    </nav>
  );
}
