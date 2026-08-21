"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SermonEmbed = SermonEmbed;
const jsx_runtime_1 = require("react/jsx-runtime");
/** Renders nothing when neither URL is set — presby does not host video
 * itself, so this is a link-out, and a page with no link to offer offers
 * nothing. */
function SermonEmbed({ liveUrl, archiveUrl, headingClassName, }) {
    if (!liveUrl && !archiveUrl)
        return null;
    return ((0, jsx_runtime_1.jsxs)("section", { "data-block": "sermon-embed", children: [(0, jsx_runtime_1.jsx)("h2", { className: headingClassName, children: "Worship Online" }), liveUrl ? (0, jsx_runtime_1.jsx)("a", { href: liveUrl, children: "Watch live" }) : null, archiveUrl ? (0, jsx_runtime_1.jsx)("a", { href: archiveUrl, children: "Watch past services" }) : null] }));
}
