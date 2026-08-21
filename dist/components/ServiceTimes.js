"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ServiceTimes = ServiceTimes;
const jsx_runtime_1 = require("react/jsx-runtime");
const utils_1 = require("../utils");
/** Renders nothing when there are no service times set — this is the
 * omissibility contract this block exists to demonstrate. */
function ServiceTimes({ serviceTimes, headingClassName, }) {
    if (serviceTimes.length === 0)
        return null;
    return ((0, jsx_runtime_1.jsxs)("section", { "data-block": "service-times", "aria-label": "Service times", children: [(0, jsx_runtime_1.jsx)("h2", { className: headingClassName, children: "Service Times" }), (0, jsx_runtime_1.jsx)("ul", { children: serviceTimes.map((entry, index) => (
                // eslint-disable-next-line react/no-array-index-key
                (0, jsx_runtime_1.jsxs)("li", { children: [entry.label ? `${entry.label} — ` : "", (0, utils_1.dayName)(entry.dayOfWeek), " ", (0, utils_1.formatClockTime)(entry.startTime), "\u2013", (0, utils_1.formatClockTime)(entry.endTime)] }, index))) })] }));
}
