"use strict";
"use client";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Nav = Nav;
const jsx_runtime_1 = require("react/jsx-runtime");
const react_1 = require("react");
const nav_grouping_1 = require("../nav-grouping");
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
function Nav({ entries, currentPath, portalUrl, logoUrl, logoAlt, organizationName, organizationHomeUrl, promoText, }) {
    const [mobileOpen, setMobileOpen] = (0, react_1.useState)(false);
    const [openGroup, setOpenGroup] = (0, react_1.useState)(null);
    const [hidden, setHidden] = (0, react_1.useState)(false);
    const lastScrollY = (0, react_1.useRef)(0);
    (0, react_1.useEffect)(() => {
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
    const { top, groups } = (0, nav_grouping_1.groupEntries)(entries);
    // A `highlight` entry (the reference's own "Give" pill button) is a
    // call-to-action, not a peer of the regular top-level links -- the
    // reference always renders it LAST, after every dropdown group, however
    // its own navOrder sorts among the flat entry list. An ordinary
    // (non-highlight) ungrouped entry keeps rendering before the groups.
    const topLeading = top.filter((entry) => !entry.highlight);
    const topTrailing = top.filter((entry) => entry.highlight);
    const showPageLinks = entries.length >= 2;
    if (!showPageLinks && !portalUrl && !logoUrl)
        return null;
    return ((0, jsx_runtime_1.jsx)("nav", { "aria-label": "Site", "data-block": "nav", "data-hidden": hidden ? "true" : "false", children: (0, jsx_runtime_1.jsxs)("div", { "data-slot": "bar", children: [(0, jsx_runtime_1.jsx)("a", { href: organizationHomeUrl, "data-slot": "logo", children: logoUrl ? ((0, jsx_runtime_1.jsx)("img", { src: logoUrl, alt: logoAlt })) : ((0, jsx_runtime_1.jsx)("span", { "data-slot": "logo-text", children: organizationName })) }), (0, jsx_runtime_1.jsxs)("div", { "data-slot": "menu-region", children: [promoText ? (0, jsx_runtime_1.jsx)("p", { "data-slot": "promo", children: promoText }) : null, showPageLinks || portalUrl ? ((0, jsx_runtime_1.jsxs)("button", { type: "button", "data-slot": "menu-toggle", "aria-expanded": mobileOpen, "aria-controls": "site-nav-menu", "aria-label": mobileOpen ? "Close menu" : "Open menu", onClick: () => setMobileOpen((value) => !value), children: [(0, jsx_runtime_1.jsx)("span", {}), (0, jsx_runtime_1.jsx)("span", {}), (0, jsx_runtime_1.jsx)("span", {})] })) : null, (0, jsx_runtime_1.jsxs)("ul", { id: "site-nav-menu", "data-open": mobileOpen ? "true" : "false", children: [topLeading.map((entry) => ((0, jsx_runtime_1.jsx)("li", { "data-highlight": "false", children: (0, jsx_runtime_1.jsx)("a", { href: entry.href, "aria-current": entry.path === currentPath ? "page" : undefined, onClick: () => setMobileOpen(false), children: entry.label }) }, entry.path))), groups.map(({ group, items }) => ((0, jsx_runtime_1.jsx)("li", { children: (0, jsx_runtime_1.jsxs)("details", { open: openGroup === group, onPointerEnter: (event) => {
                                            if (event.pointerType === "mouse")
                                                setOpenGroup(group);
                                        }, onPointerLeave: (event) => {
                                            if (event.pointerType === "mouse")
                                                setOpenGroup(null);
                                        }, children: [(0, jsx_runtime_1.jsx)("summary", { onClick: (event) => {
                                                    // The pointer handlers above already own hover; a
                                                    // click toggles independently, for touch and
                                                    // keyboard, without fighting the hover state.
                                                    event.preventDefault();
                                                    setOpenGroup((current) => (current === group ? null : group));
                                                }, children: group }), (0, jsx_runtime_1.jsx)("ul", { children: items.map((entry) => ((0, jsx_runtime_1.jsx)("li", { children: (0, jsx_runtime_1.jsx)("a", { href: entry.href, "aria-current": entry.path === currentPath ? "page" : undefined, onClick: () => {
                                                            setMobileOpen(false);
                                                            setOpenGroup(null);
                                                        }, children: entry.label }) }, entry.path))) })] }) }, group))), topTrailing.map((entry) => ((0, jsx_runtime_1.jsx)("li", { "data-highlight": "true", children: (0, jsx_runtime_1.jsx)("a", { href: entry.href, "aria-current": entry.path === currentPath ? "page" : undefined, onClick: () => setMobileOpen(false), children: entry.label }) }, entry.path))), portalUrl ? ((0, jsx_runtime_1.jsx)("li", { "data-slot": "portal-login", children: (0, jsx_runtime_1.jsx)("a", { href: portalUrl, onClick: () => setMobileOpen(false), children: "Member Login" }) })) : null] })] })] }) }));
}
