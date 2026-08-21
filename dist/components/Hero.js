"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Hero = Hero;
const jsx_runtime_1 = require("react/jsx-runtime");
function Hero({ eyebrow, heading, tagline, body, imageUrl, imageAlt, cta, headingClassName, }) {
    return ((0, jsx_runtime_1.jsxs)("section", { "data-block": "hero", children: [imageUrl ? (0, jsx_runtime_1.jsx)("img", { src: imageUrl, alt: imageAlt ?? "" }) : null, eyebrow ? (0, jsx_runtime_1.jsx)("p", { "data-slot": "eyebrow", children: eyebrow }) : null, (0, jsx_runtime_1.jsx)("h1", { className: headingClassName, children: heading }), tagline ? (0, jsx_runtime_1.jsx)("p", { "data-slot": "tagline", children: tagline }) : null, body ? (0, jsx_runtime_1.jsx)("p", { "data-slot": "body", children: body }) : null, cta ? (0, jsx_runtime_1.jsx)("a", { href: cta.href, children: cta.label }) : null] }));
}
