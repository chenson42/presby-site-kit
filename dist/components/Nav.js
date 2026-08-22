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
 * the whole bundle's page list, not one page's own props. Renders nothing
 * at all with fewer than two navigable pages: a single-page site has
 * nothing meaningful to navigate between, the same "omit the section
 * entirely, never a blank placeholder" discipline `Footer` already follows.
 */
function Nav({ pages, currentPath, pageUrl }) {
    const entries = navEntriesFor(pages);
    if (entries.length < 2)
        return null;
    return ((0, jsx_runtime_1.jsx)("nav", { "aria-label": "Site", "data-block": "nav", children: (0, jsx_runtime_1.jsx)("ul", { children: entries.map((entry) => ((0, jsx_runtime_1.jsx)("li", { children: (0, jsx_runtime_1.jsx)("a", { href: pageUrl(entry.path), "aria-current": entry.path === currentPath ? "page" : undefined, children: entry.label }) }, entry.path))) }) }));
}
