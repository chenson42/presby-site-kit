"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FeatureGrid = FeatureGrid;
const jsx_runtime_1 = require("react/jsx-runtime");
/** Renders nothing when `items` is empty — every valid-but-empty block
 * collapses to "render nothing for this block", not an empty shell. */
function FeatureGrid({ items, headingClassName, }) {
    if (items.length === 0)
        return null;
    return ((0, jsx_runtime_1.jsx)("section", { "data-block": "feature-grid", children: (0, jsx_runtime_1.jsx)("ul", { children: items.map((item, index) => (
            // eslint-disable-next-line react/no-array-index-key
            (0, jsx_runtime_1.jsx)("li", { children: (0, jsx_runtime_1.jsxs)("a", { href: item.href, children: [(0, jsx_runtime_1.jsx)("h2", { className: headingClassName, children: item.heading }), (0, jsx_runtime_1.jsx)("p", { children: item.body })] }) }, index))) }) }));
}
