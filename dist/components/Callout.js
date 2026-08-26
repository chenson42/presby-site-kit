"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Callout = Callout;
const jsx_runtime_1 = require("react/jsx-runtime");
const markdown_1 = require("../markdown");
function Callout({ heading, body, imageUrl, imageAlt, cta, headingClassName, variant = "split", imageSide = "left", background, headingColor, }) {
    const style = {};
    if (variant === "inset" && background) {
        style["--site-callout-bg"] = background;
    }
    const headingStyle = headingColor
        ? { color: headingColor }
        : undefined;
    return ((0, jsx_runtime_1.jsxs)("section", { "data-block": "callout", "data-variant": variant, "data-image-side": imageSide, style: style, children: [imageUrl ? (
            // Natural aspect ratio, never a forced square -- a portrait photo
            // (e.g. the worship page's own headshot) squashes badly under a
            // 1:1 crop; this component never assumes a photo's shape.
            (0, jsx_runtime_1.jsx)("img", { "data-slot": "image", src: imageUrl, alt: imageAlt ?? "" })) : null, (0, jsx_runtime_1.jsxs)("div", { "data-slot": "content", children: [(0, jsx_runtime_1.jsx)("h2", { className: headingClassName, style: headingStyle, children: heading }), (0, jsx_runtime_1.jsx)("div", { "data-slot": "body", children: (0, markdown_1.renderMarkdown)({ body }) }), cta ? (0, jsx_runtime_1.jsx)("a", { href: cta.href, children: cta.label }) : null] })] }));
}
