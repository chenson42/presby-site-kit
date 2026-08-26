"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FeatureGrid = FeatureGrid;
const jsx_runtime_1 = require("react/jsx-runtime");
/** Renders nothing when `items` is empty -- every valid-but-empty block
 * collapses to "render nothing for this block", not an empty shell. */
function FeatureGrid({ items, headingClassName, variant = "card", }) {
    if (items.length === 0)
        return null;
    return ((0, jsx_runtime_1.jsx)("section", { "data-block": "feature-grid", "data-variant": variant, children: (0, jsx_runtime_1.jsx)("ul", { children: items.map((item, index) => (
            // eslint-disable-next-line react/no-array-index-key
            (0, jsx_runtime_1.jsx)("li", { children: (0, jsx_runtime_1.jsxs)("a", { href: item.href, children: [variant === "card" && item.imageUrl ? ((0, jsx_runtime_1.jsx)("img", { src: item.imageUrl, alt: item.imageAlt ?? "" })) : null, (0, jsx_runtime_1.jsxs)("div", { "data-slot": "content", children: [(0, jsx_runtime_1.jsx)("h2", { className: headingClassName, children: item.heading }), (0, jsx_runtime_1.jsx)("p", { children: item.body })] }), variant === "solid" ? ((0, jsx_runtime_1.jsx)("span", { "data-slot": "arrow", "aria-hidden": "true" })) : null] }) }, index))) }) }));
}
