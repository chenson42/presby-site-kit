import type { ReactNode } from "react";
import { sanitizeHref } from "./utils";

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

function parseInline(text: string): ReactNode[] {
  const nodes: ReactNode[] = [];
  let lastIndex = 0;
  let key = 0;
  let match: RegExpExecArray | null;
  INLINE_PATTERN.lastIndex = 0;
  while ((match = INLINE_PATTERN.exec(text)) !== null) {
    if (match.index > lastIndex) {
      nodes.push(text.slice(lastIndex, match.index));
    }
    if (match[1] !== undefined) {
      // [label](href)
      const label = match[1];
      const href = sanitizeHref(match[2]);
      nodes.push(
        href ? (
          // eslint-disable-next-line react/no-array-index-key
          <a key={key++} href={href}>
            {label}
          </a>
        ) : (
          `${label} (${match[2]})`
        ),
      );
    } else if (match[3] !== undefined) {
      nodes.push(<strong key={key++}>{match[3]}</strong>);
    } else if (match[4] !== undefined) {
      nodes.push(<em key={key++}>{match[4]}</em>);
    }
    lastIndex = INLINE_PATTERN.lastIndex;
  }
  if (lastIndex < text.length) {
    nodes.push(text.slice(lastIndex));
  }
  return nodes;
}

type Block =
  | { kind: "heading"; level: 1 | 2 | 3 | 4 | 5 | 6; text: string }
  | { kind: "paragraph"; text: string }
  | { kind: "unordered-list"; items: string[] }
  | { kind: "ordered-list"; items: string[] }
  | { kind: "rule" };

const HEADING_RE = /^(#{1,6})\s+(.+)$/;
const UNORDERED_RE = /^[-*]\s+(.+)$/;
const ORDERED_RE = /^\d+\.\s+(.+)$/;
// Deliberately requires 3+ hyphens on their own line so it never collides
// with UNORDERED_RE's single `- item` bullet syntax. Doubles as an EXPLICIT
// column-break marker for Prose's `columns` layout — see Prose.tsx's own
// comment on why an author-placed break beats CSS multicol auto-balancing.
const RULE_RE = /^-{3,}\s*$/;

function parseBlocks(source: string): Block[] {
  const lines = source.replace(/\r\n/g, "\n").split("\n");
  const blocks: Block[] = [];
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    if (line.trim().length === 0) {
      i++;
      continue;
    }

    if (RULE_RE.test(line)) {
      blocks.push({ kind: "rule" });
      i++;
      continue;
    }

    const heading = HEADING_RE.exec(line);
    if (heading) {
      blocks.push({
        kind: "heading",
        level: heading[1].length as 1 | 2 | 3 | 4 | 5 | 6,
        text: heading[2].trim(),
      });
      i++;
      continue;
    }

    if (UNORDERED_RE.test(line)) {
      const items: string[] = [];
      while (i < lines.length && UNORDERED_RE.test(lines[i])) {
        items.push(UNORDERED_RE.exec(lines[i])![1].trim());
        i++;
      }
      blocks.push({ kind: "unordered-list", items });
      continue;
    }

    if (ORDERED_RE.test(line)) {
      const items: string[] = [];
      while (i < lines.length && ORDERED_RE.test(lines[i])) {
        items.push(ORDERED_RE.exec(lines[i])![1].trim());
        i++;
      }
      blocks.push({ kind: "ordered-list", items });
      continue;
    }

    const paragraphLines: string[] = [];
    while (
      i < lines.length &&
      lines[i].trim().length > 0 &&
      !HEADING_RE.test(lines[i]) &&
      !UNORDERED_RE.test(lines[i]) &&
      !ORDERED_RE.test(lines[i]) &&
      !RULE_RE.test(lines[i])
    ) {
      paragraphLines.push(lines[i].trim());
      i++;
    }
    blocks.push({ kind: "paragraph", text: paragraphLines.join(" ") });
  }
  return blocks;
}

export interface RenderMarkdownOptions {
  body: string;
  headingClassName?: string;
}

export function renderMarkdown({
  body,
  headingClassName,
}: RenderMarkdownOptions): ReactNode[] {
  return parseBlocks(body).map((block, index) => {
    const key = `md-${index}`;
    switch (block.kind) {
      case "heading": {
        const Tag = `h${block.level}` as
          | "h1"
          | "h2"
          | "h3"
          | "h4"
          | "h5"
          | "h6";
        return (
          <Tag key={key} className={headingClassName}>
            {parseInline(block.text)}
          </Tag>
        );
      }
      case "paragraph":
        return <p key={key}>{parseInline(block.text)}</p>;
      case "unordered-list":
        return (
          <ul key={key}>
            {block.items.map((item, itemIndex) => (
              // eslint-disable-next-line react/no-array-index-key
              <li key={itemIndex}>{parseInline(item)}</li>
            ))}
          </ul>
        );
      case "ordered-list":
        return (
          <ol key={key}>
            {block.items.map((item, itemIndex) => (
              // eslint-disable-next-line react/no-array-index-key
              <li key={itemIndex}>{parseInline(item)}</li>
            ))}
          </ol>
        );
      case "rule":
        return <hr key={key} />;
    }
  });
}
