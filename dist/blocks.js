"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ALLOWED_BLOCK_TYPES = exports.BLOCK_REGISTRY = void 0;
const jsx_runtime_1 = require("react/jsx-runtime");
const Callout_1 = require("./components/Callout");
const DonateLink_1 = require("./components/DonateLink");
const EventList_1 = require("./components/EventList");
const FeatureGrid_1 = require("./components/FeatureGrid");
const Gallery_1 = require("./components/Gallery");
const Hero_1 = require("./components/Hero");
const MinistryList_1 = require("./components/MinistryList");
const Prose_1 = require("./components/Prose");
const ServiceTimes_1 = require("./components/ServiceTimes");
const SermonEmbed_1 = require("./components/SermonEmbed");
const StaffList_1 = require("./components/StaffList");
const ValuesGrid_1 = require("./components/ValuesGrid");
const utils_1 = require("./utils");
/** `sanitizeHref` already narrows a content-authored href to one of three
 * shapes: bundle-relative (`/...`), same-page anchor (`#...`), or an
 * absolute http(s)/mailto/tel URL. Only the first shape is this bundle's
 * own — that's the one `pageUrl` needs to prefix; a hash or an external URL
 * passes through unchanged. */
function resolveHref(href, ctx) {
    return href.startsWith("/") ? ctx.pageUrl(href) : href;
}
function asHeroSlides(value, ctx) {
    return (0, utils_1.asArray)(value).flatMap((raw) => {
        if (!(0, utils_1.isRecord)(raw))
            return [];
        const imageKey = (0, utils_1.asNonEmptyString)(raw.image ?? raw.imageUrl);
        if (imageKey === null)
            return [];
        return [
            {
                imageUrl: ctx.imageUrl(imageKey),
                imageAlt: (0, utils_1.asNonEmptyString)(raw.imageAlt) ?? "",
                eyebrow: (0, utils_1.asNonEmptyString)(raw.eyebrow) ?? undefined,
                heading: (0, utils_1.asNonEmptyString)(raw.heading) ?? undefined,
            },
        ];
    });
}
function renderHeroBlock(props, ctx) {
    const slides = asHeroSlides(props.slides, ctx);
    // A per-slide carousel (the reference's own home-page hero) carries its
    // own heading per slide and never repeats it at the block's top level --
    // only the single-image sub-page hero requires one there. Valid iff
    // EITHER exists; heroProps.heading (required by the component) falls
    // back to the first slide's own heading when the top-level is unset.
    const topHeading = (0, utils_1.asNonEmptyString)(props.heading);
    const heading = topHeading ?? slides[0]?.heading ?? null;
    if (heading === null)
        return null;
    const imageKey = (0, utils_1.asNonEmptyString)(props.image);
    const heroProps = {
        heading,
        eyebrow: (0, utils_1.asNonEmptyString)(props.eyebrow) ?? undefined,
        tagline: (0, utils_1.asNonEmptyString)(props.tagline) ?? undefined,
        body: (0, utils_1.asNonEmptyString)(props.body) ?? undefined,
        imageUrl: imageKey ? ctx.imageUrl(imageKey) : undefined,
        imageAlt: (0, utils_1.asNonEmptyString)(props.imageAlt) ?? undefined,
        slides: slides.length > 0 ? slides : undefined,
        cta: resolveCta((0, utils_1.asCta)(props.cta), ctx) ?? undefined,
        headingClassName: ctx.headingClassName,
        variant: props.variant === "carousel" ? "carousel" : "subpage",
    };
    return (0, jsx_runtime_1.jsx)(Hero_1.Hero, { ...heroProps });
}
function resolveCta(cta, ctx) {
    return cta ? { ...cta, href: resolveHref(cta.href, ctx) } : null;
}
function asFeatureGridItems(value, ctx) {
    return (0, utils_1.asArray)(value).flatMap((raw) => {
        if (!(0, utils_1.isRecord)(raw))
            return [];
        const heading = (0, utils_1.asNonEmptyString)(raw.heading);
        const body = (0, utils_1.asNonEmptyString)(raw.body);
        const href = (0, utils_1.sanitizeHref)(raw.href);
        if (heading === null || body === null || href === null)
            return [];
        const imageKey = (0, utils_1.asNonEmptyString)(raw.image);
        return [
            {
                heading,
                body,
                href: resolveHref(href, ctx),
                imageUrl: imageKey ? ctx.imageUrl(imageKey) : undefined,
                imageAlt: (0, utils_1.asNonEmptyString)(raw.imageAlt) ?? undefined,
            },
        ];
    });
}
function renderFeatureGridBlock(props, ctx) {
    const items = asFeatureGridItems(props.items, ctx);
    if (items.length === 0)
        return null;
    const variant = props.variant === "solid" ? "solid" : "card";
    return ((0, jsx_runtime_1.jsx)(FeatureGrid_1.FeatureGrid, { items: items, headingClassName: ctx.headingClassName, variant: variant }));
}
function renderCalloutBlock(props, ctx) {
    const heading = (0, utils_1.asNonEmptyString)(props.heading);
    const body = (0, utils_1.asNonEmptyString)(props.body);
    if (heading === null || body === null)
        return null;
    // `cta` is OPTIONAL -- the reference site's own "Stay in touch" callout
    // has no button at all. `asCta`/`resolveCta` return null on a missing
    // prop, which used to mean "skip the whole block"; now it means "render
    // without a button."
    const rawCta = props.cta;
    const cta = rawCta === undefined ? null : resolveCta((0, utils_1.asCta)(rawCta), ctx);
    const imageKey = (0, utils_1.asNonEmptyString)(props.image);
    const variant = props.variant === "inset" ? "inset" : "split";
    const imageSide = props.imageSide === "right" ? "right" : "left";
    return ((0, jsx_runtime_1.jsx)(Callout_1.Callout, { heading: heading, body: body, cta: cta ?? undefined, imageUrl: imageKey ? ctx.imageUrl(imageKey) : undefined, imageAlt: (0, utils_1.asNonEmptyString)(props.imageAlt) ?? undefined, headingClassName: ctx.headingClassName, variant: variant, imageSide: imageSide, background: variant === "inset" ? (0, utils_1.asHexColor)(props.background) ?? undefined : undefined, headingColor: (0, utils_1.asHexColor)(props.headingColor) ?? undefined }));
}
function renderServiceTimesBlock(_props, ctx) {
    const serviceTimes = ctx.profile?.serviceTimes ?? [];
    if (serviceTimes.length === 0)
        return null;
    return (0, jsx_runtime_1.jsx)(ServiceTimes_1.ServiceTimes, { serviceTimes: serviceTimes, headingClassName: ctx.headingClassName });
}
function asStaffPeople(value, ctx) {
    return (0, utils_1.asArray)(value).flatMap((raw) => {
        if (!(0, utils_1.isRecord)(raw))
            return [];
        const name = (0, utils_1.asNonEmptyString)(raw.name);
        // title is optional (StaffList.tsx) -- was wrongly required here too,
        // which silently DROPPED a person entirely from the page if their
        // entry had no title, rather than just omitting a subtitle line.
        if (name === null)
            return [];
        const title = (0, utils_1.asNonEmptyString)(raw.title);
        const photoKey = (0, utils_1.asNonEmptyString)(raw.photo);
        return [
            {
                name,
                title: title ?? undefined,
                phone: (0, utils_1.asNonEmptyString)(raw.phone) ?? undefined,
                email: (0, utils_1.asNonEmptyString)(raw.email) ?? undefined,
                photoUrl: photoKey ? ctx.imageUrl(photoKey) : undefined,
            },
        ];
    });
}
function renderStaffListBlock(props, ctx) {
    const people = asStaffPeople(props.people, ctx);
    if (people.length === 0)
        return null;
    return (0, jsx_runtime_1.jsx)(StaffList_1.StaffList, { people: people, headingClassName: ctx.headingClassName });
}
function asHeadingBodyImageItems(value, ctx) {
    return (0, utils_1.asArray)(value).flatMap((raw) => {
        if (!(0, utils_1.isRecord)(raw))
            return [];
        const heading = (0, utils_1.asNonEmptyString)(raw.heading);
        const body = (0, utils_1.asNonEmptyString)(raw.body);
        if (heading === null || body === null)
            return [];
        const imageKey = (0, utils_1.asNonEmptyString)(raw.image);
        return [
            {
                heading,
                body,
                imageUrl: imageKey ? ctx.imageUrl(imageKey) : undefined,
                imageAlt: (0, utils_1.asNonEmptyString)(raw.imageAlt) ?? undefined,
            },
        ];
    });
}
function renderValuesGridBlock(props, ctx) {
    const items = asHeadingBodyImageItems(props.items, ctx);
    if (items.length === 0)
        return null;
    return (0, jsx_runtime_1.jsx)(ValuesGrid_1.ValuesGrid, { items: items, headingClassName: ctx.headingClassName });
}
function renderMinistryListBlock(props, ctx) {
    const items = asHeadingBodyImageItems(props.items, ctx);
    if (items.length === 0)
        return null;
    return (0, jsx_runtime_1.jsx)(MinistryList_1.MinistryList, { items: items, headingClassName: ctx.headingClassName });
}
function asGalleryImages(value, ctx) {
    return (0, utils_1.asArray)(value).flatMap((raw) => {
        if (typeof raw === "string") {
            const key = (0, utils_1.asNonEmptyString)(raw);
            return key ? [{ url: ctx.imageUrl(key), alt: "" }] : [];
        }
        if ((0, utils_1.isRecord)(raw)) {
            const key = (0, utils_1.asNonEmptyString)(raw.image);
            if (key === null)
                return [];
            return [{ url: ctx.imageUrl(key), alt: (0, utils_1.asNonEmptyString)(raw.alt) ?? "" }];
        }
        return [];
    });
}
function renderGalleryBlock(props, ctx) {
    const images = asGalleryImages(props.images, ctx);
    if (images.length === 0)
        return null;
    const intervalMs = typeof props.intervalMs === "number" ? props.intervalMs : undefined;
    const variant = props.variant === "grid" ? "grid" : "carousel";
    return (0, jsx_runtime_1.jsx)(Gallery_1.Gallery, { images: images, intervalMs: intervalMs, variant: variant });
}
function asEvents(value, ctx) {
    return (0, utils_1.asArray)(value).flatMap((raw) => {
        if (!(0, utils_1.isRecord)(raw))
            return [];
        const title = (0, utils_1.asNonEmptyString)(raw.title);
        const startsAt = (0, utils_1.asNonEmptyString)(raw.startsAt);
        if (title === null || startsAt === null)
            return [];
        const href = (0, utils_1.sanitizeHref)(raw.href);
        return [
            {
                title,
                startsAt,
                endsAt: (0, utils_1.asNonEmptyString)(raw.endsAt) ?? undefined,
                location: (0, utils_1.asNonEmptyString)(raw.location) ?? undefined,
                href: href ? resolveHref(href, ctx) : undefined,
            },
        ];
    });
}
function renderEventListBlock(props, ctx) {
    const events = asEvents(props.events, ctx);
    if (events.length === 0)
        return null;
    return (0, jsx_runtime_1.jsx)(EventList_1.EventList, { events: events, headingClassName: ctx.headingClassName });
}
function renderSermonEmbedBlock(props, ctx) {
    const liveUrl = (0, utils_1.sanitizeHref)(props.liveUrl) ?? undefined;
    const archiveUrl = (0, utils_1.sanitizeHref)(props.archiveUrl) ?? undefined;
    if (!liveUrl && !archiveUrl)
        return null;
    return ((0, jsx_runtime_1.jsx)(SermonEmbed_1.SermonEmbed, { liveUrl: liveUrl, archiveUrl: archiveUrl, description: (0, utils_1.asNonEmptyString)(props.description) ?? undefined, headingClassName: ctx.headingClassName }));
}
function renderDonateLinkBlock(props, ctx) {
    const label = (0, utils_1.asNonEmptyString)(props.label);
    const href = (0, utils_1.sanitizeHref)(props.href);
    if (label === null || href === null)
        return null;
    return (0, jsx_runtime_1.jsx)(DonateLink_1.DonateLink, { label: label, href: resolveHref(href, ctx) });
}
function renderProseBlock(props, ctx) {
    const body = (0, utils_1.asString)(props.body);
    if (body === null || body.trim().length === 0)
        return null;
    const columns = typeof props.columns === "number" ? props.columns : undefined;
    return ((0, jsx_runtime_1.jsx)(Prose_1.Prose, { body: body, headingClassName: ctx.headingClassName, columns: columns, headingColor: (0, utils_1.asHexColor)(props.headingColor) ?? undefined }));
}
function renderContactFormBlock(props, ctx) {
    // No `ctx.contactForm` means the caller never wired one up (or this
    // page rendered outside presby's own runtime, e.g. a unit test) --
    // skip the block entirely rather than render heading/aside chrome
    // around an empty form slot.
    if (!ctx.contactForm)
        return null;
    const heading = (0, utils_1.asNonEmptyString)(props.heading);
    if (heading === null)
        return null;
    const intro = (0, utils_1.asNonEmptyString)(props.intro);
    const aside = (0, utils_1.asString)(props.aside);
    const headingColor = (0, utils_1.asHexColor)(props.headingColor) ?? undefined;
    return ((0, jsx_runtime_1.jsxs)("section", { "data-block": "contact-form", "data-has-aside": aside && aside.trim().length > 0 ? "true" : undefined, children: [(0, jsx_runtime_1.jsxs)("div", { "data-slot": "main", children: [(0, jsx_runtime_1.jsx)("h2", { className: ctx.headingClassName, style: headingColor ? { color: headingColor } : undefined, children: heading }), intro ? (0, jsx_runtime_1.jsx)("p", { "data-slot": "intro", children: intro }) : null, ctx.contactForm] }), aside && aside.trim().length > 0 ? ((0, jsx_runtime_1.jsx)("div", { "data-slot": "aside", children: (0, jsx_runtime_1.jsx)(Prose_1.Prose, { body: aside, headingClassName: ctx.headingClassName }) })) : null] }));
}
exports.BLOCK_REGISTRY = {
    hero: renderHeroBlock,
    featureGrid: renderFeatureGridBlock,
    callout: renderCalloutBlock,
    serviceTimes: renderServiceTimesBlock,
    staffList: renderStaffListBlock,
    valuesGrid: renderValuesGridBlock,
    ministryList: renderMinistryListBlock,
    eventList: renderEventListBlock,
    sermonEmbed: renderSermonEmbedBlock,
    donateLink: renderDonateLinkBlock,
    prose: renderProseBlock,
    gallery: renderGalleryBlock,
    contactForm: renderContactFormBlock,
};
/** Every block `type` this release recognizes — anything else is skipped
 * by `renderSiteBundle()`, never rendered, never executed. */
exports.ALLOWED_BLOCK_TYPES = Object.freeze(Object.keys(exports.BLOCK_REGISTRY));
