"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MinistryList = MinistryList;
const jsx_runtime_1 = require("react/jsx-runtime");
function MinistryList({ items, headingClassName, }) {
    if (items.length === 0)
        return null;
    return ((0, jsx_runtime_1.jsx)("section", { "data-block": "ministry-list", children: (0, jsx_runtime_1.jsx)("ul", { children: items.map((item, index) => (
            // eslint-disable-next-line react/no-array-index-key
            (0, jsx_runtime_1.jsxs)("li", { children: [(0, jsx_runtime_1.jsx)("h3", { className: headingClassName, children: item.heading }), (0, jsx_runtime_1.jsx)("p", { children: item.body })] }, index))) }) }));
}
