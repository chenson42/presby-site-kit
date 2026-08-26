"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Footer = Footer;
const jsx_runtime_1 = require("react/jsx-runtime");
const utils_1 = require("../utils");
const nav_grouping_1 = require("../nav-grouping");
const SOCIAL_LABELS = {
    facebook: "Facebook",
    instagram: "Instagram",
    xTwitter: "X (Twitter)",
    youtube: "YouTube",
    other: "Website",
};
const SOCIAL_ICON_PATHS = {
    facebook: "M22 12a10 10 0 1 0-11.6 9.9v-7H7.9V12h2.5V9.8c0-2.5 1.5-3.9 3.8-3.9 1.1 0 2.2.2 2.2.2v2.4h-1.2c-1.2 0-1.6.8-1.6 1.6V12h2.8l-.4 2.9h-2.4v7A10 10 0 0 0 22 12Z",
    instagram: "M12 2c2.7 0 3.1 0 4.1.1 1.1 0 1.8.2 2.5.5.7.3 1.2.6 1.8 1.2.6.6.9 1.1 1.2 1.8.3.7.4 1.4.5 2.5.1 1 .1 1.4.1 4.1s0 3.1-.1 4.1c0 1.1-.2 1.8-.5 2.5-.3.7-.6 1.2-1.2 1.8-.6.6-1.1.9-1.8 1.2-.7.3-1.4.4-2.5.5-1 .1-1.4.1-4.1.1s-3.1 0-4.1-.1c-1.1 0-1.8-.2-2.5-.5-.7-.3-1.2-.6-1.8-1.2-.6-.6-.9-1.1-1.2-1.8-.3-.7-.4-1.4-.5-2.5C2 15.1 2 14.7 2 12s0-3.1.1-4.1c0-1.1.2-1.8.5-2.5.3-.7.6-1.2 1.2-1.8.6-.6 1.1-.9 1.8-1.2.7-.3 1.4-.4 2.5-.5C8.9 2 9.3 2 12 2Zm0 1.8c-2.6 0-3 0-4 .1-1 0-1.5.2-1.9.3-.5.2-.8.4-1.2.8-.4.4-.6.7-.8 1.2-.1.4-.3.9-.3 1.9-.1 1-.1 1.4-.1 4s0 3 .1 4c0 1 .2 1.5.3 1.9.2.5.4.8.8 1.2.4.4.7.6 1.2.8.4.1.9.3 1.9.3 1 .1 1.4.1 4 .1s3 0 4-.1c1 0 1.5-.2 1.9-.3.5-.2.8-.4 1.2-.8.4-.4.6-.7.8-1.2.1-.4.3-.9.3-1.9.1-1 .1-1.4.1-4s0-3-.1-4c0-1-.2-1.5-.3-1.9-.2-.5-.4-.8-.8-1.2-.4-.4-.7-.6-1.2-.8-.4-.1-.9-.3-1.9-.3-1-.1-1.4-.1-4-.1Zm0 3.5a4.7 4.7 0 1 1 0 9.4 4.7 4.7 0 0 1 0-9.4Zm0 1.8a2.9 2.9 0 1 0 0 5.8 2.9 2.9 0 0 0 0-5.8Zm4.9-2a1.1 1.1 0 1 1 0 2.2 1.1 1.1 0 0 1 0-2.2Z",
    xTwitter: "M18.9 2.5h3.2l-7 8 8.2 11h-6.4l-5-6.6-5.8 6.6H1.9l7.5-8.6-7.9-10.4h6.6l4.5 6.1 5.3-6.1Zm-1.1 17h1.7L7.2 4.4H5.4l12.4 15.1Z",
    youtube: "M23.5 6.2a3 3 0 0 0-2.1-2.1C19.5 3.5 12 3.5 12 3.5s-7.5 0-9.4.6A3 3 0 0 0 .5 6.2 31 31 0 0 0 0 12a31 31 0 0 0 .5 5.8 3 3 0 0 0 2.1 2.1c1.9.6 9.4.6 9.4.6s7.5 0 9.4-.6a3 3 0 0 0 2.1-2.1A31 31 0 0 0 24 12a31 31 0 0 0-.5-5.8ZM9.6 15.5V8.5l6.3 3.5-6.3 3.5Z",
    other: "M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20Zm6.9 6h-3a15 15 0 0 0-1.3-4A8.3 8.3 0 0 1 18.9 8ZM12 4.1c.7 1 1.6 2.4 2.1 3.9H9.9c.5-1.5 1.4-2.9 2.1-3.9ZM4.3 14a8 8 0 0 1 0-4h3.4a17 17 0 0 0 0 4Zm.8 2h3a15 15 0 0 0 1.3 4A8.3 8.3 0 0 1 5.1 16Zm3-8h-3a8.3 8.3 0 0 1 4.3-4 15 15 0 0 0-1.3 4Zm4 12c-.7-1-1.6-2.4-2.1-3.9h4.2c-.5 1.5-1.4 2.9-2.1 3.9ZM14.5 14h-5a13 13 0 0 1 0-4h5a13 13 0 0 1 0 4Zm.4 5.9c.5-1.2 1-2.6 1.3-4h3a8.3 8.3 0 0 1-4.3 4ZM16.4 14a17 17 0 0 0 0-4h3.4a8 8 0 0 1 0 4Z",
};
function worshipLine(entries) {
    if (entries.length === 0)
        return null;
    const first = entries[0];
    if (!first)
        return null;
    const days = [...new Set(entries.map((e) => e.dayOfWeek))].sort();
    const dayLabel = days.length === 1 && days[0] !== undefined
        ? `${(0, utils_1.dayName)(days[0])}s`
        : days.map((d) => (0, utils_1.dayName)(d)).join(", ");
    return `${dayLabel} ${(0, utils_1.formatClockTime)(first.startTime)}`;
}
/**
 * Groups consecutive days sharing identical start/end times into one
 * readable range, e.g. four identical Monday-Thursday office-hours rows
 * collapse to "Monday–Thursday 9:00 AM–3:30 PM" rather than four lines.
 * Non-consecutive or differently-timed days each get their own line.
 */
function scheduleRuns(entries) {
    const sorted = [...entries].sort((a, b) => a.dayOfWeek - b.dayOfWeek);
    const lines = [];
    let i = 0;
    while (i < sorted.length) {
        const start = sorted[i];
        if (!start)
            break;
        let j = i;
        while (j + 1 < sorted.length &&
            sorted[j + 1]?.dayOfWeek === (sorted[j]?.dayOfWeek ?? -1) + 1 &&
            sorted[j + 1]?.startTime === start.startTime &&
            sorted[j + 1]?.endTime === start.endTime) {
            j += 1;
        }
        const end = sorted[j];
        const dayLabel = j === i || !end
            ? (0, utils_1.dayName)(start.dayOfWeek)
            : `${(0, utils_1.dayName)(start.dayOfWeek)}–${(0, utils_1.dayName)(end.dayOfWeek)}`;
        lines.push(`${dayLabel} ${(0, utils_1.formatClockTime)(start.startTime)}–${(0, utils_1.formatClockTime)(start.endTime)}`);
        i = j + 1;
    }
    return lines;
}
function Footer({ profile, headingClassName, entries, logoUrl, logoAlt, organizationName, }) {
    const { groups } = (0, nav_grouping_1.groupEntries)(entries);
    if (!profile && groups.length === 0)
        return null;
    const directionsHref = profile?.address ? (0, utils_1.mapsSearchUrl)(profile.address) : null;
    const phoneHref = profile?.phone ? (0, utils_1.sanitizeHref)(`tel:${profile.phone}`) : null;
    const worship = profile ? worshipLine(profile.serviceTimes) : null;
    const officeHoursLines = profile ? scheduleRuns(profile.officeHours) : [];
    return ((0, jsx_runtime_1.jsxs)("footer", { "data-block": "footer", children: [(0, jsx_runtime_1.jsxs)("div", { "data-slot": "footer-main", children: [(0, jsx_runtime_1.jsxs)("div", { "data-slot": "footer-left", children: [logoUrl ? ((0, jsx_runtime_1.jsx)("img", { "data-slot": "footer-logo", src: logoUrl, alt: logoAlt })) : ((0, jsx_runtime_1.jsx)("p", { "data-slot": "footer-logo-text", children: organizationName })), profile?.address ? (0, jsx_runtime_1.jsx)("p", { "data-slot": "address", children: profile.address }) : null, profile?.phone && phoneHref ? ((0, jsx_runtime_1.jsx)("p", { "data-slot": "phone", children: (0, jsx_runtime_1.jsx)("a", { href: phoneHref, children: profile.phone }) })) : null, worship || officeHoursLines.length > 0 ? ((0, jsx_runtime_1.jsxs)("div", { "data-slot": "schedules", children: [worship ? ((0, jsx_runtime_1.jsxs)("p", { children: [(0, jsx_runtime_1.jsx)("span", { "data-slot": "schedule-label", children: "Worship:" }), " ", worship] })) : null, officeHoursLines.length > 0 ? ((0, jsx_runtime_1.jsxs)("p", { children: [(0, jsx_runtime_1.jsx)("span", { "data-slot": "schedule-label", children: "Office hours:" }), " ", officeHoursLines.join(", ")] })) : null] })) : null, directionsHref ? ((0, jsx_runtime_1.jsx)("a", { "data-slot": "directions-button", href: directionsHref, children: "Get directions" })) : null] }), groups.length > 0 ? ((0, jsx_runtime_1.jsx)("div", { "data-slot": "footer-nav-groups", children: groups.map(({ group, items }) => ((0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsx)("h2", { className: headingClassName, children: group }), (0, jsx_runtime_1.jsx)("ul", { children: items.map((entry) => ((0, jsx_runtime_1.jsx)("li", { children: (0, jsx_runtime_1.jsx)("a", { href: entry.href, children: entry.label }) }, entry.path))) })] }, group))) })) : null] }), (0, jsx_runtime_1.jsxs)("div", { "data-slot": "footer-bottom", children: [(0, jsx_runtime_1.jsxs)("p", { children: ["\u00A9 ", new Date().getUTCFullYear(), " All rights reserved"] }), profile && profile.socialLinks.length > 0 ? ((0, jsx_runtime_1.jsx)("nav", { "aria-label": "Social media", "data-slot": "social-links", children: (0, jsx_runtime_1.jsx)("ul", { children: profile.socialLinks.flatMap((link, index) => {
                                const href = (0, utils_1.sanitizeHref)(link.url);
                                if (!href)
                                    return [];
                                return [
                                    // eslint-disable-next-line react/no-array-index-key
                                    (0, jsx_runtime_1.jsx)("li", { children: (0, jsx_runtime_1.jsxs)("a", { href: href, target: "_blank", rel: "noopener noreferrer", children: [(0, jsx_runtime_1.jsx)("svg", { viewBox: "0 0 24 24", "aria-hidden": "true", focusable: "false", children: (0, jsx_runtime_1.jsx)("path", { d: SOCIAL_ICON_PATHS[link.platform] ?? SOCIAL_ICON_PATHS.other }) }), (0, jsx_runtime_1.jsx)("span", { className: "sr-only", children: SOCIAL_LABELS[link.platform] ?? SOCIAL_LABELS.other })] }) }, index),
                                ];
                            }) }) })) : null] })] }));
}
