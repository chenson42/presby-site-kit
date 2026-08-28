"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PersonCard = PersonCard;
const jsx_runtime_1 = require("react/jsx-runtime");
function PersonCard({ name, title, photoUrl, headingClassName, className, }) {
    return ((0, jsx_runtime_1.jsxs)("div", { "data-block": "person-card", className: className, children: [photoUrl ? (0, jsx_runtime_1.jsx)("img", { src: photoUrl, alt: name }) : null, (0, jsx_runtime_1.jsx)("h3", { className: headingClassName, children: name }), title ? (0, jsx_runtime_1.jsx)("p", { "data-slot": "title", children: title }) : null] }));
}
