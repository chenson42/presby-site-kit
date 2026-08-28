"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildSitemapEntries = exports.buildPageMetadata = exports.ValuesGrid = exports.StaffList = exports.SermonEmbed = exports.ServiceTimes = exports.Prose = exports.PersonCard = exports.groupEntries = exports.Nav = exports.MinistryList = exports.Hero = exports.Gallery = exports.Footer = exports.FeatureGrid = exports.EventList = exports.DonateLink = exports.Callout = exports.ALLOWED_BLOCK_TYPES = void 0;
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
/**
 * A page opts into nav the same way as before (`frontMatter.navLabel`),
 * now with three more OPTIONAL frontMatter keys the reference site's own
 * structure needed: `navGroup` (a dropdown group name -- unset renders as
 * a top-level item), `navHref` (an absolute external URL override -- the
 * reference's own "Give" item links straight to an external donation
 * platform, never a page within this bundle), and `navHighlight`
 * (renders as a filled pill button). `navOrder` (a number) sorts the
 * final list; entries without it keep their `pages` array order,
 * stable-sorted after the ordered ones.
 */
/**
 * `extraEntries` merges synthetic, non-page-derived entries (currently just
 * the portal link, when `portalNavGroup`+`portalLabel` fold it into an
 * existing group) into the SAME numeric sort pass as page-derived entries —
 * comparing a re-derived `order` value after the fact, once page identity
 * has already been erased down to `{path, label, href, group, highlight}`,
 * would compare apples to nothing. `index` for an extra entry is
 * `pages.length` so ties against same-order page entries land after them,
 * matching "unset sorts last" for the tie itself.
 */
function navEntriesFor(pages, pageUrl, extraEntries = []) {
    const withOrder = pages.flatMap((page, index) => {
        const fm = (0, utils_1.isRecord)(page.frontMatter) ? page.frontMatter : {};
        const label = (0, utils_1.asNonEmptyString)(fm.navLabel);
        if (label === null)
            return [];
        const group = (0, utils_1.asNonEmptyString)(fm.navGroup);
        const hrefOverride = (0, utils_1.sanitizeHref)(fm.navHref);
        const order = typeof fm.navOrder === "number" ? fm.navOrder : null;
        const entry = {
            path: page.path,
            label,
            href: hrefOverride ?? pageUrl(page.path),
            group,
            highlight: fm.navHighlight === true,
        };
        return [{ entry, order: order ?? Number.MAX_SAFE_INTEGER, index }];
    });
    const withExtras = [
        ...withOrder,
        ...extraEntries.map((e) => ({ ...e, index: pages.length })),
    ];
    return withExtras
        .sort((a, b) => a.order - b.order || a.index - b.index)
        .map((w) => w.entry);
}
/**
 * "Join us Sundays at 10:15 AM" -- the reference site's own promo line,
 * derived from the org profile's first service time rather than
 * separately authored content, so it can never drift from the real
 * schedule. `null` when there's no service time to build one from.
 */
function promoTextFor(profile) {
    const first = profile?.serviceTimes[0];
    if (!first)
        return null;
    return `Join us ${(0, utils_1.dayName)(first.dayOfWeek)}s at ${(0, utils_1.formatClockTime)(first.startTime)}`;
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
        contactForm: input.contactForm,
        liveSlots: input.liveSlots,
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
    const grouped = Boolean(input.portalUrl && input.portalNavGroup && input.portalLabel);
    const entries = navEntriesFor(input.pages, input.pageUrl, grouped
        ? [
            {
                entry: {
                    path: input.portalUrl,
                    label: input.portalLabel,
                    href: input.portalUrl,
                    group: input.portalNavGroup,
                    highlight: false,
                },
                order: input.portalNavOrder ?? Number.MAX_SAFE_INTEGER,
            },
        ]
        : []);
    return ((0, jsx_runtime_1.jsxs)("div", { className: input.brand?.fontPairing.bodyClassName
            ? `presby-site ${input.brand.fontPairing.bodyClassName}`
            : "presby-site", children: [(0, jsx_runtime_1.jsx)(Nav_1.Nav, { entries: entries, currentPath: input.currentPath, portalUrl: grouped ? null : input.portalUrl, logoUrl: input.logoUrl, logoAlt: `${input.organizationName} logo`, organizationName: input.organizationName, organizationHomeUrl: input.pageUrl("/"), promoText: promoTextFor(input.profile) }), rendered.map(({ key, element }) => ((0, jsx_runtime_1.jsx)(react_1.Fragment, { children: element }, key))), (0, jsx_runtime_1.jsx)(Footer_1.Footer, { profile: input.profile, headingClassName: ctx.headingClassName, entries: entries, logoUrl: input.logoUrl, logoAlt: `${input.organizationName} logo`, organizationName: input.organizationName })] }));
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
var Gallery_1 = require("./components/Gallery");
Object.defineProperty(exports, "Gallery", { enumerable: true, get: function () { return Gallery_1.Gallery; } });
var Hero_1 = require("./components/Hero");
Object.defineProperty(exports, "Hero", { enumerable: true, get: function () { return Hero_1.Hero; } });
var MinistryList_1 = require("./components/MinistryList");
Object.defineProperty(exports, "MinistryList", { enumerable: true, get: function () { return MinistryList_1.MinistryList; } });
var Nav_2 = require("./components/Nav");
Object.defineProperty(exports, "Nav", { enumerable: true, get: function () { return Nav_2.Nav; } });
var nav_grouping_1 = require("./nav-grouping");
Object.defineProperty(exports, "groupEntries", { enumerable: true, get: function () { return nav_grouping_1.groupEntries; } });
var PersonCard_1 = require("./components/PersonCard");
Object.defineProperty(exports, "PersonCard", { enumerable: true, get: function () { return PersonCard_1.PersonCard; } });
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
var seo_1 = require("./seo");
Object.defineProperty(exports, "buildPageMetadata", { enumerable: true, get: function () { return seo_1.buildPageMetadata; } });
Object.defineProperty(exports, "buildSitemapEntries", { enumerable: true, get: function () { return seo_1.buildSitemapEntries; } });
