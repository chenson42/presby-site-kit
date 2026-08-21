"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DonateLink = DonateLink;
const jsx_runtime_1 = require("react/jsx-runtime");
/** A styled external link — presby does not process payments itself.
 * `target="_blank"` always pairs with `rel="noopener noreferrer"` (reverse-
 * tabnabbing is a real risk for any external link this package renders on
 * a congregation's behalf, not a hypothetical). */
function DonateLink({ label, href }) {
    return ((0, jsx_runtime_1.jsx)("a", { "data-block": "donate-link", href: href, target: "_blank", rel: "noopener noreferrer", children: label }));
}
