"use strict";
"use client";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Nav = Nav;
const jsx_runtime_1 = require("react/jsx-runtime");
const react_1 = require("react");
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
function Nav({ entries, currentPath, portalUrl }) {
    const [open, setOpen] = (0, react_1.useState)(false);
    const showPageLinks = entries.length >= 2;
    if (!showPageLinks && !portalUrl)
        return null;
    return ((0, jsx_runtime_1.jsxs)("nav", { "aria-label": "Site", "data-block": "nav", children: [(0, jsx_runtime_1.jsx)("div", { "data-slot": "bar", children: (0, jsx_runtime_1.jsxs)("button", { type: "button", "data-slot": "menu-toggle", "aria-expanded": open, "aria-controls": "site-nav-menu", "aria-label": open ? "Close menu" : "Open menu", onClick: () => setOpen((value) => !value), children: [(0, jsx_runtime_1.jsx)("span", {}), (0, jsx_runtime_1.jsx)("span", {}), (0, jsx_runtime_1.jsx)("span", {})] }) }), (0, jsx_runtime_1.jsxs)("ul", { id: "site-nav-menu", "data-open": open ? "true" : "false", children: [showPageLinks
                        ? entries.map((entry) => ((0, jsx_runtime_1.jsx)("li", { children: (0, jsx_runtime_1.jsx)("a", { href: entry.href, "aria-current": entry.path === currentPath ? "page" : undefined, onClick: () => setOpen(false), children: entry.label }) }, entry.path)))
                        : null, portalUrl ? ((0, jsx_runtime_1.jsx)("li", { "data-slot": "portal-login", children: (0, jsx_runtime_1.jsx)("a", { href: portalUrl, onClick: () => setOpen(false), children: "Member Login" }) })) : null] })] }));
}
