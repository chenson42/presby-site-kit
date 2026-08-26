"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.StaffList = StaffList;
const jsx_runtime_1 = require("react/jsx-runtime");
function StaffList({ people, headingClassName, }) {
    if (people.length === 0)
        return null;
    return ((0, jsx_runtime_1.jsx)("section", { "data-block": "staff-list", children: (0, jsx_runtime_1.jsx)("ul", { children: people.map((person, index) => (
            // eslint-disable-next-line react/no-array-index-key
            (0, jsx_runtime_1.jsxs)("li", { children: [person.photoUrl ? ((0, jsx_runtime_1.jsx)("img", { src: person.photoUrl, alt: person.name })) : null, (0, jsx_runtime_1.jsx)("h3", { className: headingClassName, children: person.name }), person.title ? (0, jsx_runtime_1.jsx)("p", { "data-slot": "title", children: person.title }) : null, person.phone ? (0, jsx_runtime_1.jsx)("p", { "data-slot": "phone", children: person.phone }) : null, person.email ? ((0, jsx_runtime_1.jsx)("a", { href: `mailto:${person.email}`, children: person.email })) : null] }, index))) }) }));
}
