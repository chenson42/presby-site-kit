"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ValuesGrid = exports.StaffList = exports.SermonEmbed = exports.ServiceTimes = exports.Prose = exports.Nav = exports.MinistryList = exports.Hero = exports.Footer = exports.FeatureGrid = exports.EventList = exports.DonateLink = exports.Callout = exports.ALLOWED_BLOCK_TYPES = void 0;
exports.renderSiteBundle = renderSiteBundle;
const jsx_runtime_1 = require("react/jsx-runtime");
const react_1 = require("react");
const blocks_1 = require("./blocks");
const Footer_1 = require("./components/Footer");
const Nav_1 = require("./components/Nav");
const utils_1 = require("./utils");
function isContentBlockShape(value) {
    return (0, utils_1.isRecord)(value) && typeof value.type === "string";
}
/** A page opts into nav by setting `frontMatter.navLabel` to a non-empty
 * string, in whatever order the bundle's own `pages` array lists them —
 * this package never reorders or infers an order from `path`. Resolved
 * here, server-side, rather than inside `Nav` itself: `Nav` is a client
 * component (it owns the narrow-viewport open/closed toggle state), so it
 * can only receive serializable props — `pageUrl`, a closure, cannot cross
 * that boundary, but the plain `{ path, label, href }` this produces can. */
function navEntriesFor(pages, pageUrl) {
    return pages.flatMap((page) => {
        const label = (0, utils_1.isRecord)(page.frontMatter)
            ? (0, utils_1.asNonEmptyString)(page.frontMatter.navLabel)
            : null;
        return label ? [{ path: page.path, label, href: pageUrl(page.path) }] : [];
    });
}
/** Defensive narrowing of `page.mdxAst` into `ContentBlock[]`. Anything
 * that isn't the expected `{ blocks: [...] }` shape — including every
 * legacy v0.0.1-stub `{ raw: string }` page still sitting in an
 * unmigrated content repo — collapses to an empty array: the page's body
 * renders as nothing rather than throwing. Individual malformed blocks
 * (missing `type`) are filtered out here; a present-but-unrecognized
 * `type` is filtered later, by the allowlist lookup in `renderSiteBundle`. */
function extractBlocks(mdxAst) {
    if (!(0, utils_1.isRecord)(mdxAst))
        return [];
    const blocks = mdxAst.blocks;
    if (!Array.isArray(blocks))
        return [];
    return blocks.filter(isContentBlockShape).map((block) => ({
        type: block.type,
        props: (0, utils_1.isRecord)(block.props) ? block.props : {},
    }));
}
/**
 * Renders the page in `input.pages` whose `path` matches
 * `input.currentPath`. Returns `null` when no such page exists — the
 * caller's own contract (presby's `page.tsx`) treats `null` as "call
 * notFound()", exactly the same enumeration-safe collapse presby's own
 * `getPublishedSite()` already applies one layer up.
 *
 * For a matched page, iterates `mdxAst.blocks`, looks each block's `type`
 * up against `ALLOWED_BLOCK_TYPES`, and renders the matching component with
 * its (defensively validated) `props`. An unrecognized `type`, or a block
 * whose required props are missing/malformed, is skipped — never thrown —
 * so one bad block never takes down the rest of the page. `Footer` chrome
 * is composed automatically below every page's blocks, reading `profile`
 * directly; it is not a block type itself, since every page needs it.
 */
function renderSiteBundle(input) {
    const page = input.pages.find((p) => p.path === input.currentPath);
    if (!page)
        return null;
    const ctx = {
        imageUrl: input.imageUrl,
        pageUrl: input.pageUrl,
        profile: input.profile,
        headingClassName: input.brand?.fontPairing.headingClassName,
    };
    const blocks = extractBlocks(page.mdxAst);
    const rendered = blocks
        .map((block, index) => {
        const renderer = blocks_1.BLOCK_REGISTRY[block.type];
        if (!renderer)
            return null;
        const element = renderer(block.props, ctx);
        if (element === null)
            return null;
        return { key: `${block.type}-${index}`, element };
    })
        .filter((entry) => entry !== null);
    return ((0, jsx_runtime_1.jsxs)("div", { className: input.brand?.fontPairing.bodyClassName
            ? `presby-site ${input.brand.fontPairing.bodyClassName}`
            : "presby-site", children: [(0, jsx_runtime_1.jsx)(Nav_1.Nav, { entries: navEntriesFor(input.pages, input.pageUrl), currentPath: input.currentPath, portalUrl: input.portalUrl }), rendered.map(({ key, element }) => ((0, jsx_runtime_1.jsx)(react_1.Fragment, { children: element }, key))), (0, jsx_runtime_1.jsx)(Footer_1.Footer, { profile: input.profile, headingClassName: ctx.headingClassName })] }));
}
var blocks_2 = require("./blocks");
Object.defineProperty(exports, "ALLOWED_BLOCK_TYPES", { enumerable: true, get: function () { return blocks_2.ALLOWED_BLOCK_TYPES; } });
var Callout_1 = require("./components/Callout");
Object.defineProperty(exports, "Callout", { enumerable: true, get: function () { return Callout_1.Callout; } });
var DonateLink_1 = require("./components/DonateLink");
Object.defineProperty(exports, "DonateLink", { enumerable: true, get: function () { return DonateLink_1.DonateLink; } });
var EventList_1 = require("./components/EventList");
Object.defineProperty(exports, "EventList", { enumerable: true, get: function () { return EventList_1.EventList; } });
var FeatureGrid_1 = require("./components/FeatureGrid");
Object.defineProperty(exports, "FeatureGrid", { enumerable: true, get: function () { return FeatureGrid_1.FeatureGrid; } });
var Footer_2 = require("./components/Footer");
Object.defineProperty(exports, "Footer", { enumerable: true, get: function () { return Footer_2.Footer; } });
var Hero_1 = require("./components/Hero");
Object.defineProperty(exports, "Hero", { enumerable: true, get: function () { return Hero_1.Hero; } });
var MinistryList_1 = require("./components/MinistryList");
Object.defineProperty(exports, "MinistryList", { enumerable: true, get: function () { return MinistryList_1.MinistryList; } });
var Nav_2 = require("./components/Nav");
Object.defineProperty(exports, "Nav", { enumerable: true, get: function () { return Nav_2.Nav; } });
var Prose_1 = require("./components/Prose");
Object.defineProperty(exports, "Prose", { enumerable: true, get: function () { return Prose_1.Prose; } });
var ServiceTimes_1 = require("./components/ServiceTimes");
Object.defineProperty(exports, "ServiceTimes", { enumerable: true, get: function () { return ServiceTimes_1.ServiceTimes; } });
var SermonEmbed_1 = require("./components/SermonEmbed");
Object.defineProperty(exports, "SermonEmbed", { enumerable: true, get: function () { return SermonEmbed_1.SermonEmbed; } });
var StaffList_1 = require("./components/StaffList");
Object.defineProperty(exports, "StaffList", { enumerable: true, get: function () { return StaffList_1.StaffList; } });
var ValuesGrid_1 = require("./components/ValuesGrid");
Object.defineProperty(exports, "ValuesGrid", { enumerable: true, get: function () { return ValuesGrid_1.ValuesGrid; } });
