"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.renderMarkdown = renderMarkdown;
const jsx_runtime_1 = require("react/jsx-runtime");
const utils_1 = require("./utils");
/**
 * A deliberately small markdown-to-React path: headings, paragraphs, lists,
 * links, and emphasis only. There is no raw-HTML branch anywhere in this
 * file, and no `dangerouslySetInnerHTML` anywhere in this package — every
 * character of source text that isn't consumed by one of the patterns below
 * is emitted as a plain JS string, which React itself escapes on render. A
 * `<script>...</script>` or `<img onerror=...>` string inside a `prose`
 * block's `body` therefore renders as inert visible text, never as markup.
 *
 * This is intentionally not "real" Markdown (no tables, no fenced code, no
 * raw HTML passthrough — CommonMark explicitly allows raw HTML passthrough,
 * which is exactly the trust boundary DESIGN-v1-components.md rejects). If
 * a richer subset is ever wanted, it has to be added pattern-by-pattern to
 * this file, never by swapping in a general-purpose parser configured to
 * "disable" HTML — see this package's README for why a dependency here is a
 * real decision, not a rubber stamp.
 */
// Deliberately asterisk-only for emphasis (no `_..._`): a `_..._`
// alternative collides with ordinary prose containing a double underscore
// (`__init__`, `SOME__CONST`, "the __pwned flag") — the underscore pair
// gets read as an emphasis delimiter and mangles unrelated text. Asterisks
// alone satisfy the design note's "emphasis" requirement without that
// footgun.
const INLINE_PATTERN = /\[([^\]]+)\]\(([^)\s]+)\)|\*\*([^*]+)\*\*|\*([^*]+)\*/g;
function parseInline(text) {
    const nodes = [];
    let lastIndex = 0;
    let key = 0;
    let match;
    INLINE_PATTERN.lastIndex = 0;
    while ((match = INLINE_PATTERN.exec(text)) !== null) {
        if (match.index > lastIndex) {
            nodes.push(text.slice(lastIndex, match.index));
        }
        if (match[1] !== undefined) {
            // [label](href)
            const label = match[1];
            const href = (0, utils_1.sanitizeHref)(match[2]);
            nodes.push(href ? (
            // eslint-disable-next-line react/no-array-index-key
            (0, jsx_runtime_1.jsx)("a", { href: href, children: label }, key++)) : (`${label} (${match[2]})`));
        }
        else if (match[3] !== undefined) {
            nodes.push((0, jsx_runtime_1.jsx)("strong", { children: match[3] }, key++));
        }
        else if (match[4] !== undefined) {
            nodes.push((0, jsx_runtime_1.jsx)("em", { children: match[4] }, key++));
        }
        lastIndex = INLINE_PATTERN.lastIndex;
    }
    if (lastIndex < text.length) {
        nodes.push(text.slice(lastIndex));
    }
    return nodes;
}
const HEADING_RE = /^(#{1,6})\s+(.+)$/;
const UNORDERED_RE = /^[-*]\s+(.+)$/;
const ORDERED_RE = /^\d+\.\s+(.+)$/;
function parseBlocks(source) {
    const lines = source.replace(/\r\n/g, "\n").split("\n");
    const blocks = [];
    let i = 0;
    while (i < lines.length) {
        const line = lines[i];
        if (line.trim().length === 0) {
            i++;
            continue;
        }
        const heading = HEADING_RE.exec(line);
        if (heading) {
            blocks.push({
                kind: "heading",
                level: heading[1].length,
                text: heading[2].trim(),
            });
            i++;
            continue;
        }
        if (UNORDERED_RE.test(line)) {
            const items = [];
            while (i < lines.length && UNORDERED_RE.test(lines[i])) {
                items.push(UNORDERED_RE.exec(lines[i])[1].trim());
                i++;
            }
            blocks.push({ kind: "unordered-list", items });
            continue;
        }
        if (ORDERED_RE.test(line)) {
            const items = [];
            while (i < lines.length && ORDERED_RE.test(lines[i])) {
                items.push(ORDERED_RE.exec(lines[i])[1].trim());
                i++;
            }
            blocks.push({ kind: "ordered-list", items });
            continue;
        }
        const paragraphLines = [];
        while (i < lines.length &&
            lines[i].trim().length > 0 &&
            !HEADING_RE.test(lines[i]) &&
            !UNORDERED_RE.test(lines[i]) &&
            !ORDERED_RE.test(lines[i])) {
            paragraphLines.push(lines[i].trim());
            i++;
        }
        blocks.push({ kind: "paragraph", text: paragraphLines.join(" ") });
    }
    return blocks;
}
function renderMarkdown({ body, headingClassName, }) {
    return parseBlocks(body).map((block, index) => {
        const key = `md-${index}`;
        switch (block.kind) {
            case "heading": {
                const Tag = `h${block.level}`;
                return ((0, jsx_runtime_1.jsx)(Tag, { className: headingClassName, children: parseInline(block.text) }, key));
            }
            case "paragraph":
                return (0, jsx_runtime_1.jsx)("p", { children: parseInline(block.text) }, key);
            case "unordered-list":
                return ((0, jsx_runtime_1.jsx)("ul", { children: block.items.map((item, itemIndex) => (
                    // eslint-disable-next-line react/no-array-index-key
                    (0, jsx_runtime_1.jsx)("li", { children: parseInline(item) }, itemIndex))) }, key));
            case "ordered-list":
                return ((0, jsx_runtime_1.jsx)("ol", { children: block.items.map((item, itemIndex) => (
                    // eslint-disable-next-line react/no-array-index-key
                    (0, jsx_runtime_1.jsx)("li", { children: parseInline(item) }, itemIndex))) }, key));
        }
    });
}
