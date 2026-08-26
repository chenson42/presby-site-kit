"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SermonEmbed = SermonEmbed;
const jsx_runtime_1 = require("react/jsx-runtime");
const utils_1 = require("../utils");
/** Renders nothing when neither URL is set — presby does not host video
 * itself, so this is fundamentally a link-out, and a page with no link to
 * offer offers nothing.
 *
 * `archiveUrl`/`liveUrl` serve two roles at once: whichever one resolves
 * through `toTrustedEmbedUrl()` (see ../utils.ts's own header comment for
 * the allowlist/validation reasoning — never a raw content-authored URL
 * reaching an `<iframe src>`) becomes the actual embedded player; the
 * archive URL is tried first since the reference site's own "watch past
 * services" playlist is what's reliably embeddable (a bare
 * `/channel/<id>/live` URL, the live-stream shape, carries no video or
 * list id `toTrustedEmbedUrl` can validate, so it stays a plain link-out
 * in practice). Whichever URL does NOT become the embed still renders as
 * its own external link below the frame — a visitor always has a way to
 * reach both without depending on the embed resolving.
 */
function SermonEmbed({ liveUrl, archiveUrl, description, headingClassName, }) {
    if (!liveUrl && !archiveUrl)
        return null;
    const embedFromArchive = (0, utils_1.toTrustedEmbedUrl)(archiveUrl);
    const embedIsArchive = embedFromArchive !== null;
    const embedUrl = embedFromArchive ?? (0, utils_1.toTrustedEmbedUrl)(liveUrl);
    const embedIsLive = embedUrl !== null && !embedIsArchive;
    return ((0, jsx_runtime_1.jsxs)("section", { "data-block": "sermon-embed", children: [(0, jsx_runtime_1.jsx)("h2", { className: headingClassName, children: "Worship Online" }), description ? (0, jsx_runtime_1.jsx)("p", { "data-slot": "description", children: description }) : null, embedUrl ? ((0, jsx_runtime_1.jsx)("div", { "data-slot": "frame", children: (0, jsx_runtime_1.jsx)("iframe", { src: embedUrl, title: "Worship service", loading: "lazy", allow: "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture", allowFullScreen: true }) })) : null, (0, jsx_runtime_1.jsxs)("div", { "data-slot": "links", children: [liveUrl && !embedIsLive ? (0, jsx_runtime_1.jsx)("a", { href: liveUrl, children: "Watch live" }) : null, archiveUrl && !embedIsArchive ? (0, jsx_runtime_1.jsx)("a", { href: archiveUrl, children: "Watch past services" }) : null] })] }));
}
