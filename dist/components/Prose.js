"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Prose = Prose;
const jsx_runtime_1 = require("react/jsx-runtime");
const markdown_1 = require("../markdown");
function Prose({ body, headingClassName }) {
    return (0, jsx_runtime_1.jsx)("div", { "data-block": "prose", children: (0, markdown_1.renderMarkdown)({ body, headingClassName }) });
}
