"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Nav = Nav;
const jsx_runtime_1 = require("react/jsx-runtime");
const utils_1 = require("../utils");
/** A page opts into nav by setting `frontMatter.navLabel` to a non-empty
 * string, in whatever order the bundle's own `pages` array lists them —
 * this package never reorders or infers an order from `path`. */
function navEntriesFor(pages) {
    return pages.flatMap((page) => {
        const label = (0, utils_1.isRecord)(page.frontMatter)
            ? (0, utils_1.asNonEmptyString)(page.frontMatter.navLabel)
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
function Nav({ pages, currentPath, pageUrl, portalUrl }) {
    const entries = navEntriesFor(pages);
    const showPageLinks = entries.length >= 2;
    if (!showPageLinks && !portalUrl)
        return null;
    return ((0, jsx_runtime_1.jsx)("nav", { "aria-label": "Site", "data-block": "nav", children: (0, jsx_runtime_1.jsxs)("ul", { children: [showPageLinks
                    ? entries.map((entry) => ((0, jsx_runtime_1.jsx)("li", { children: (0, jsx_runtime_1.jsx)("a", { href: pageUrl(entry.path), "aria-current": entry.path === currentPath ? "page" : undefined, children: entry.label }) }, entry.path)))
                    : null, portalUrl ? ((0, jsx_runtime_1.jsx)("li", { "data-slot": "portal-login", children: (0, jsx_runtime_1.jsx)("a", { href: portalUrl, children: "Member Login" }) })) : null] }) }));
}
