"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Footer = Footer;
const jsx_runtime_1 = require("react/jsx-runtime");
const utils_1 = require("../utils");
const SOCIAL_LABELS = {
    facebook: "Facebook",
    instagram: "Instagram",
    xTwitter: "X (Twitter)",
    youtube: "YouTube",
    other: "Website",
};
function ScheduleList({ heading, entries, headingClassName, }) {
    if (entries.length === 0)
        return null;
    return ((0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsx)("h2", { className: headingClassName, children: heading }), (0, jsx_runtime_1.jsx)("ul", { children: entries.map((entry, index) => (
                // eslint-disable-next-line react/no-array-index-key
                (0, jsx_runtime_1.jsxs)("li", { children: [entry.label ? `${entry.label} — ` : "", (0, utils_1.dayName)(entry.dayOfWeek), " ", (0, utils_1.formatClockTime)(entry.startTime), "\u2013", (0, utils_1.formatClockTime)(entry.endTime)] }, index))) })] }));
}
/**
 * Footer chrome, composed automatically by `renderSiteBundle()` below every
 * page's blocks — not a content block itself, since every page needs it.
 * Reads `profile` directly, the same as the `serviceTimes` block.
 */
function Footer({ profile, headingClassName }) {
    if (!profile)
        return null;
    const directionsHref = profile.address ? (0, utils_1.mapsSearchUrl)(profile.address) : null;
    const phoneHref = profile.phone ? (0, utils_1.sanitizeHref)(`tel:${profile.phone}`) : null;
    return ((0, jsx_runtime_1.jsxs)("footer", { "data-block": "footer", children: [profile.address ? ((0, jsx_runtime_1.jsxs)("div", { "data-slot": "address", children: [(0, jsx_runtime_1.jsx)("p", { children: profile.address }), directionsHref ? (0, jsx_runtime_1.jsx)("a", { href: directionsHref, children: "Get directions" }) : null] })) : null, profile.phone && phoneHref ? ((0, jsx_runtime_1.jsx)("p", { "data-slot": "phone", children: (0, jsx_runtime_1.jsx)("a", { href: phoneHref, children: profile.phone }) })) : null, profile.serviceTimes.length > 0 ? ((0, jsx_runtime_1.jsx)("div", { "data-slot": "service-times", children: (0, jsx_runtime_1.jsx)(ScheduleList, { heading: "Service Times", entries: profile.serviceTimes, headingClassName: headingClassName }) })) : null, profile.officeHours.length > 0 ? ((0, jsx_runtime_1.jsx)("div", { "data-slot": "office-hours", children: (0, jsx_runtime_1.jsx)(ScheduleList, { heading: "Office Hours", entries: profile.officeHours, headingClassName: headingClassName }) })) : null, profile.socialLinks.length > 0 ? ((0, jsx_runtime_1.jsx)("nav", { "aria-label": "Social media", "data-slot": "social-links", children: (0, jsx_runtime_1.jsx)("ul", { children: profile.socialLinks.flatMap((link, index) => {
                        const href = (0, utils_1.sanitizeHref)(link.url);
                        if (!href)
                            return [];
                        return [
                            // eslint-disable-next-line react/no-array-index-key
                            (0, jsx_runtime_1.jsx)("li", { children: (0, jsx_runtime_1.jsx)("a", { href: href, target: "_blank", rel: "noopener noreferrer", children: SOCIAL_LABELS[link.platform] ?? SOCIAL_LABELS.other }) }, index),
                        ];
                    }) }) })) : null] }));
}
