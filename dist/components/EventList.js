"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EventList = EventList;
const jsx_runtime_1 = require("react/jsx-runtime");
const utils_1 = require("../utils");
function EventList({ events, headingClassName, }) {
    if (events.length === 0)
        return null;
    return ((0, jsx_runtime_1.jsx)("section", { "data-block": "event-list", children: (0, jsx_runtime_1.jsx)("ul", { children: events.map((event, index) => {
                const starts = (0, utils_1.formatEventDateTime)(event.startsAt);
                const ends = event.endsAt ? (0, utils_1.formatEventDateTime)(event.endsAt) : null;
                const heading = (0, jsx_runtime_1.jsx)("h3", { className: headingClassName, children: event.title });
                return (
                // eslint-disable-next-line react/no-array-index-key
                (0, jsx_runtime_1.jsxs)("li", { children: [event.href ? (0, jsx_runtime_1.jsx)("a", { href: event.href, children: heading }) : heading, starts ? ((0, jsx_runtime_1.jsxs)("p", { "data-slot": "when", children: [starts, ends ? ` – ${ends}` : ""] })) : null, event.location ? (0, jsx_runtime_1.jsx)("p", { "data-slot": "location", children: event.location }) : null] }, index));
            }) }) }));
}
