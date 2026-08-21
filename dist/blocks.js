"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ALLOWED_BLOCK_TYPES = exports.BLOCK_REGISTRY = void 0;
const jsx_runtime_1 = require("react/jsx-runtime");
const Callout_1 = require("./components/Callout");
const DonateLink_1 = require("./components/DonateLink");
const EventList_1 = require("./components/EventList");
const FeatureGrid_1 = require("./components/FeatureGrid");
const Hero_1 = require("./components/Hero");
const MinistryList_1 = require("./components/MinistryList");
const Prose_1 = require("./components/Prose");
const ServiceTimes_1 = require("./components/ServiceTimes");
const SermonEmbed_1 = require("./components/SermonEmbed");
const StaffList_1 = require("./components/StaffList");
const ValuesGrid_1 = require("./components/ValuesGrid");
const utils_1 = require("./utils");
function renderHeroBlock(props, ctx) {
    const heading = (0, utils_1.asNonEmptyString)(props.heading);
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
        cta: (0, utils_1.asCta)(props.cta) ?? undefined,
        headingClassName: ctx.headingClassName,
    };
    return (0, jsx_runtime_1.jsx)(Hero_1.Hero, { ...heroProps });
}
function asFeatureGridItems(value) {
    return (0, utils_1.asArray)(value).flatMap((raw) => {
        if (!(0, utils_1.isRecord)(raw))
            return [];
        const heading = (0, utils_1.asNonEmptyString)(raw.heading);
        const body = (0, utils_1.asNonEmptyString)(raw.body);
        const href = (0, utils_1.sanitizeHref)(raw.href);
        if (heading === null || body === null || href === null)
            return [];
        return [{ heading, body, href }];
    });
}
function renderFeatureGridBlock(props, ctx) {
    const items = asFeatureGridItems(props.items);
    if (items.length === 0)
        return null;
    return (0, jsx_runtime_1.jsx)(FeatureGrid_1.FeatureGrid, { items: items, headingClassName: ctx.headingClassName });
}
function renderCalloutBlock(props, ctx) {
    const heading = (0, utils_1.asNonEmptyString)(props.heading);
    const body = (0, utils_1.asNonEmptyString)(props.body);
    const cta = (0, utils_1.asCta)(props.cta);
    if (heading === null || body === null || cta === null)
        return null;
    const imageKey = (0, utils_1.asNonEmptyString)(props.image);
    return ((0, jsx_runtime_1.jsx)(Callout_1.Callout, { heading: heading, body: body, cta: cta, imageUrl: imageKey ? ctx.imageUrl(imageKey) : undefined, imageAlt: (0, utils_1.asNonEmptyString)(props.imageAlt) ?? undefined, headingClassName: ctx.headingClassName }));
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
        const title = (0, utils_1.asNonEmptyString)(raw.title);
        if (name === null || title === null)
            return [];
        const photoKey = (0, utils_1.asNonEmptyString)(raw.photo);
        return [
            {
                name,
                title,
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
function asHeadingBodyItems(value) {
    return (0, utils_1.asArray)(value).flatMap((raw) => {
        if (!(0, utils_1.isRecord)(raw))
            return [];
        const heading = (0, utils_1.asNonEmptyString)(raw.heading);
        const body = (0, utils_1.asNonEmptyString)(raw.body);
        if (heading === null || body === null)
            return [];
        return [{ heading, body }];
    });
}
function renderValuesGridBlock(props, ctx) {
    const items = asHeadingBodyItems(props.items);
    if (items.length === 0)
        return null;
    return (0, jsx_runtime_1.jsx)(ValuesGrid_1.ValuesGrid, { items: items, headingClassName: ctx.headingClassName });
}
function renderMinistryListBlock(props, ctx) {
    const items = asHeadingBodyItems(props.items);
    if (items.length === 0)
        return null;
    return (0, jsx_runtime_1.jsx)(MinistryList_1.MinistryList, { items: items, headingClassName: ctx.headingClassName });
}
function asEvents(value) {
    return (0, utils_1.asArray)(value).flatMap((raw) => {
        if (!(0, utils_1.isRecord)(raw))
            return [];
        const title = (0, utils_1.asNonEmptyString)(raw.title);
        const startsAt = (0, utils_1.asNonEmptyString)(raw.startsAt);
        if (title === null || startsAt === null)
            return [];
        return [
            {
                title,
                startsAt,
                endsAt: (0, utils_1.asNonEmptyString)(raw.endsAt) ?? undefined,
                location: (0, utils_1.asNonEmptyString)(raw.location) ?? undefined,
                href: (0, utils_1.sanitizeHref)(raw.href) ?? undefined,
            },
        ];
    });
}
function renderEventListBlock(props, ctx) {
    const events = asEvents(props.events);
    if (events.length === 0)
        return null;
    return (0, jsx_runtime_1.jsx)(EventList_1.EventList, { events: events, headingClassName: ctx.headingClassName });
}
function renderSermonEmbedBlock(props, ctx) {
    const liveUrl = (0, utils_1.sanitizeHref)(props.liveUrl) ?? undefined;
    const archiveUrl = (0, utils_1.sanitizeHref)(props.archiveUrl) ?? undefined;
    if (!liveUrl && !archiveUrl)
        return null;
    return ((0, jsx_runtime_1.jsx)(SermonEmbed_1.SermonEmbed, { liveUrl: liveUrl, archiveUrl: archiveUrl, headingClassName: ctx.headingClassName }));
}
function renderDonateLinkBlock(props) {
    const label = (0, utils_1.asNonEmptyString)(props.label);
    const href = (0, utils_1.sanitizeHref)(props.href);
    if (label === null || href === null)
        return null;
    return (0, jsx_runtime_1.jsx)(DonateLink_1.DonateLink, { label: label, href: href });
}
function renderProseBlock(props, ctx) {
    const body = (0, utils_1.asString)(props.body);
    if (body === null || body.trim().length === 0)
        return null;
    return (0, jsx_runtime_1.jsx)(Prose_1.Prose, { body: body, headingClassName: ctx.headingClassName });
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
};
/** Every block `type` this release recognizes — anything else is skipped
 * by `renderSiteBundle()`, never rendered, never executed. */
exports.ALLOWED_BLOCK_TYPES = Object.freeze(Object.keys(exports.BLOCK_REGISTRY));
