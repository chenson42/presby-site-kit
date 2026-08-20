"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.renderSiteBundle = renderSiteBundle;
const jsx_runtime_1 = require("react/jsx-runtime");
function firstString(value) {
    return typeof value === "string" && value.trim().length > 0 ? value : null;
}
/**
 * Renders the page in `input.pages` whose `path` matches
 * `input.currentPath`. Returns `null` when no such page exists — the
 * caller's own contract (presby's `page.tsx`) treats `null` as "call
 * notFound()", exactly the same enumeration-safe collapse presby's own
 * `getPublishedSite()` already applies one layer up.
 *
 * Ignores `mdxAst` and every field of `frontMatter` except `title`,
 * deliberately — see this module's own header comment. `imageUrl` is
 * accepted (part of the real, stable signature) but unused by this stub;
 * a v1.0.0+ release calls it from within its own Hero/gallery components.
 */
function renderSiteBundle(input) {
    const page = input.pages.find((p) => p.path === input.currentPath);
    if (!page)
        return null;
    const title = firstString(page.frontMatter?.title);
    return ((0, jsx_runtime_1.jsxs)("div", { className: input.brand?.fontPairing.bodyClassName, children: [title ? ((0, jsx_runtime_1.jsx)("h1", { className: input.brand?.fontPairing.headingClassName, children: title })) : null, (0, jsx_runtime_1.jsx)("p", { children: "Content coming soon." })] }));
}
