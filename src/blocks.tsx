import type { ReactElement } from "react";
import { Callout } from "./components/Callout";
import { DonateLink } from "./components/DonateLink";
import { EventList, type EventListEvent } from "./components/EventList";
import { FeatureGrid, type FeatureGridItem } from "./components/FeatureGrid";
import { Hero, type HeroProps } from "./components/Hero";
import { MinistryList, type MinistryListItem } from "./components/MinistryList";
import { Prose } from "./components/Prose";
import { ServiceTimes } from "./components/ServiceTimes";
import { SermonEmbed } from "./components/SermonEmbed";
import { StaffList, type StaffPerson } from "./components/StaffList";
import { ValuesGrid, type ValuesGridItem } from "./components/ValuesGrid";
import type { RenderSiteBundleProfile } from "./types";
import { asArray, asCta, asNonEmptyString, asString, isRecord, sanitizeHref } from "./utils";

/**
 * The fixed component allowlist DESIGN-v1-components.md's architecture call
 * depends on. `renderSiteBundle()` looks a block's `type` up here; an
 * unrecognized `type` is skipped — never thrown, never rendered — and a
 * block whose `props` fail this file's own defensive validation renders
 * nothing for that one block, never crashing the rest of the page.
 */

export interface BlockRenderContext {
  imageUrl: (manifestKey: string) => string;
  /** presby's own bundle-relative page-path URL builder — the same one
   * `Nav` already receives directly (see ../index.tsx). Content-authored
   * hrefs (FeatureGrid items, Hero/Callout CTAs, EventList entries) are
   * bundle-relative paths like `/worship`, not `/site/<slug>/worship` —
   * a block renderer that emits one of those raw, un-resolved, sends the
   * visitor to presby's own root instead of back into this site. */
  pageUrl: (path: string) => string;
  profile: RenderSiteBundleProfile | null;
  headingClassName?: string;
}

type BlockRenderer = (
  props: Record<string, unknown>,
  ctx: BlockRenderContext,
) => ReactElement | null;

/** `sanitizeHref` already narrows a content-authored href to one of three
 * shapes: bundle-relative (`/...`), same-page anchor (`#...`), or an
 * absolute http(s)/mailto/tel URL. Only the first shape is this bundle's
 * own — that's the one `pageUrl` needs to prefix; a hash or an external URL
 * passes through unchanged. */
function resolveHref(href: string, ctx: BlockRenderContext): string {
  return href.startsWith("/") ? ctx.pageUrl(href) : href;
}

function renderHeroBlock(
  props: Record<string, unknown>,
  ctx: BlockRenderContext,
): ReactElement | null {
  const heading = asNonEmptyString(props.heading);
  if (heading === null) return null;
  const imageKey = asNonEmptyString(props.image);
  const heroProps: HeroProps = {
    heading,
    eyebrow: asNonEmptyString(props.eyebrow) ?? undefined,
    tagline: asNonEmptyString(props.tagline) ?? undefined,
    body: asNonEmptyString(props.body) ?? undefined,
    imageUrl: imageKey ? ctx.imageUrl(imageKey) : undefined,
    imageAlt: asNonEmptyString(props.imageAlt) ?? undefined,
    cta: resolveCta(asCta(props.cta), ctx) ?? undefined,
    headingClassName: ctx.headingClassName,
  };
  return <Hero {...heroProps} />;
}

function resolveCta(
  cta: { label: string; href: string } | null,
  ctx: BlockRenderContext,
): { label: string; href: string } | null {
  return cta ? { ...cta, href: resolveHref(cta.href, ctx) } : null;
}

function asFeatureGridItems(value: unknown, ctx: BlockRenderContext): FeatureGridItem[] {
  return asArray(value).flatMap((raw) => {
    if (!isRecord(raw)) return [];
    const heading = asNonEmptyString(raw.heading);
    const body = asNonEmptyString(raw.body);
    const href = sanitizeHref(raw.href);
    if (heading === null || body === null || href === null) return [];
    return [{ heading, body, href: resolveHref(href, ctx) }];
  });
}

function renderFeatureGridBlock(
  props: Record<string, unknown>,
  ctx: BlockRenderContext,
): ReactElement | null {
  const items = asFeatureGridItems(props.items, ctx);
  if (items.length === 0) return null;
  return <FeatureGrid items={items} headingClassName={ctx.headingClassName} />;
}

function renderCalloutBlock(
  props: Record<string, unknown>,
  ctx: BlockRenderContext,
): ReactElement | null {
  const heading = asNonEmptyString(props.heading);
  const body = asNonEmptyString(props.body);
  const cta = resolveCta(asCta(props.cta), ctx);
  if (heading === null || body === null || cta === null) return null;
  const imageKey = asNonEmptyString(props.image);
  return (
    <Callout
      heading={heading}
      body={body}
      cta={cta}
      imageUrl={imageKey ? ctx.imageUrl(imageKey) : undefined}
      imageAlt={asNonEmptyString(props.imageAlt) ?? undefined}
      headingClassName={ctx.headingClassName}
    />
  );
}

function renderServiceTimesBlock(
  _props: Record<string, unknown>,
  ctx: BlockRenderContext,
): ReactElement | null {
  const serviceTimes = ctx.profile?.serviceTimes ?? [];
  if (serviceTimes.length === 0) return null;
  return <ServiceTimes serviceTimes={serviceTimes} headingClassName={ctx.headingClassName} />;
}

function asStaffPeople(value: unknown, ctx: BlockRenderContext): StaffPerson[] {
  return asArray(value).flatMap((raw) => {
    if (!isRecord(raw)) return [];
    const name = asNonEmptyString(raw.name);
    const title = asNonEmptyString(raw.title);
    if (name === null || title === null) return [];
    const photoKey = asNonEmptyString(raw.photo);
    return [
      {
        name,
        title,
        phone: asNonEmptyString(raw.phone) ?? undefined,
        email: asNonEmptyString(raw.email) ?? undefined,
        photoUrl: photoKey ? ctx.imageUrl(photoKey) : undefined,
      },
    ];
  });
}

function renderStaffListBlock(
  props: Record<string, unknown>,
  ctx: BlockRenderContext,
): ReactElement | null {
  const people = asStaffPeople(props.people, ctx);
  if (people.length === 0) return null;
  return <StaffList people={people} headingClassName={ctx.headingClassName} />;
}

function asHeadingBodyItems(value: unknown): { heading: string; body: string }[] {
  return asArray(value).flatMap((raw) => {
    if (!isRecord(raw)) return [];
    const heading = asNonEmptyString(raw.heading);
    const body = asNonEmptyString(raw.body);
    if (heading === null || body === null) return [];
    return [{ heading, body }];
  });
}

function renderValuesGridBlock(
  props: Record<string, unknown>,
  ctx: BlockRenderContext,
): ReactElement | null {
  const items: ValuesGridItem[] = asHeadingBodyItems(props.items);
  if (items.length === 0) return null;
  return <ValuesGrid items={items} headingClassName={ctx.headingClassName} />;
}

function renderMinistryListBlock(
  props: Record<string, unknown>,
  ctx: BlockRenderContext,
): ReactElement | null {
  const items: MinistryListItem[] = asHeadingBodyItems(props.items);
  if (items.length === 0) return null;
  return <MinistryList items={items} headingClassName={ctx.headingClassName} />;
}

function asEvents(value: unknown, ctx: BlockRenderContext): EventListEvent[] {
  return asArray(value).flatMap((raw) => {
    if (!isRecord(raw)) return [];
    const title = asNonEmptyString(raw.title);
    const startsAt = asNonEmptyString(raw.startsAt);
    if (title === null || startsAt === null) return [];
    const href = sanitizeHref(raw.href);
    return [
      {
        title,
        startsAt,
        endsAt: asNonEmptyString(raw.endsAt) ?? undefined,
        location: asNonEmptyString(raw.location) ?? undefined,
        href: href ? resolveHref(href, ctx) : undefined,
      },
    ];
  });
}

function renderEventListBlock(
  props: Record<string, unknown>,
  ctx: BlockRenderContext,
): ReactElement | null {
  const events = asEvents(props.events, ctx);
  if (events.length === 0) return null;
  return <EventList events={events} headingClassName={ctx.headingClassName} />;
}

function renderSermonEmbedBlock(
  props: Record<string, unknown>,
  ctx: BlockRenderContext,
): ReactElement | null {
  const liveUrl = sanitizeHref(props.liveUrl) ?? undefined;
  const archiveUrl = sanitizeHref(props.archiveUrl) ?? undefined;
  if (!liveUrl && !archiveUrl) return null;
  return (
    <SermonEmbed liveUrl={liveUrl} archiveUrl={archiveUrl} headingClassName={ctx.headingClassName} />
  );
}

function renderDonateLinkBlock(
  props: Record<string, unknown>,
  ctx: BlockRenderContext,
): ReactElement | null {
  const label = asNonEmptyString(props.label);
  const href = sanitizeHref(props.href);
  if (label === null || href === null) return null;
  return <DonateLink label={label} href={resolveHref(href, ctx)} />;
}

function renderProseBlock(
  props: Record<string, unknown>,
  ctx: BlockRenderContext,
): ReactElement | null {
  const body = asString(props.body);
  if (body === null || body.trim().length === 0) return null;
  return <Prose body={body} headingClassName={ctx.headingClassName} />;
}

export const BLOCK_REGISTRY: Record<string, BlockRenderer> = {
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
export const ALLOWED_BLOCK_TYPES: readonly string[] = Object.freeze(
  Object.keys(BLOCK_REGISTRY),
);
