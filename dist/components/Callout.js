"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Callout = Callout;
const jsx_runtime_1 = require("react/jsx-runtime");
function Callout({ heading, body, imageUrl, imageAlt, cta, headingClassName, }) {
    return ((0, jsx_runtime_1.jsxs)("section", { "data-block": "callout", children: [imageUrl ? (0, jsx_runtime_1.jsx)("img", { src: imageUrl, alt: imageAlt ?? "" }) : null, (0, jsx_runtime_1.jsx)("h2", { className: headingClassName, children: heading }), (0, jsx_runtime_1.jsx)("p", { children: body }), (0, jsx_runtime_1.jsx)("a", { href: cta.href, children: cta.label })] }));
}
