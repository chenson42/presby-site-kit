"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Prose = Prose;
const jsx_runtime_1 = require("react/jsx-runtime");
const markdown_1 = require("../markdown");
function Prose({ body, headingClassName, columns, headingColor, fullWidth, }) {
    const columnCount = columns === 2 || columns === 3 ? columns : undefined;
    return ((0, jsx_runtime_1.jsx)("div", { "data-block": "prose", "data-columns": columnCount, "data-full-width": fullWidth ? "true" : undefined, style: headingColor
            ? { "--md-heading-color": headingColor }
            : undefined, children: (0, markdown_1.renderMarkdown)({ body, headingClassName }) }));
}
