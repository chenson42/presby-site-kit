"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Callout = Callout;
const jsx_runtime_1 = require("react/jsx-runtime");
const markdown_1 = require("../markdown");
const utils_1 = require("../utils");
function Callout({ heading, body, imageUrl, imageAlt, cta, headingClassName, variant = "split", imageSide = "left", background, headingColor, }) {
    const style = {};
    if (variant === "inset" && background) {
        style["--site-callout-bg"] = background;
        // A dark band (e.g. the reference's own solid teal) needs white text; a
        // pale tint of that same hue (e.g. its light-green variant, an
        // opacity-reduced version of the same teal) needs dark ink instead.
        // Verified against the reference's own two section types: solid teal
        // computes to luminance ~0.33 (white text), the light-green tint to
        // ~0.71 (dark text) -- 0.5 cleanly separates the two real cases.
        style.color = (0, utils_1.relativeLuminance)(background) > 0.5 ? "#293948" : "#fff";
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
