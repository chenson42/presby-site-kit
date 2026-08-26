"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Callout = Callout;
const jsx_runtime_1 = require("react/jsx-runtime");
const markdown_1 = require("../markdown");
/**
 * WCAG relative luminance. The reference site authors two visually distinct
 * "colored band" sections with the SAME component (its own bg-color-teal and
 * bg-color-light-green section variants) -- one dark (white text), one a
 * pale tint of the same hue (dark text). There's no single "inset = white
 * text" rule that covers both; computing luminance from the actual
 * `background` hex and picking accordingly is the one rule that produces
 * the right answer for both without per-block manual overrides.
 */
function relativeLuminance(hex) {
    const match = /^#([0-9a-f]{6})$/i.exec(hex);
    if (!match)
        return 0;
    const int = parseInt(match[1], 16);
    const channels = [(int >> 16) & 255, (int >> 8) & 255, int & 255].map((value) => {
        const c = value / 255;
        return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
    });
    return 0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2];
}
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
        style.color = relativeLuminance(background) > 0.5 ? "#293948" : "#fff";
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
