# presby-site-kit

The shared rendering shell for [presby](https://github.com/chenson42/presby)'s
public congregation websites (`/site/<slug>`). presby imports this package's
one entry point, `renderSiteBundle()`, to turn a normalized content bundle
(front-matter + parsed MDX AST + an image manifest, staged by a content
repo's own CI) into JSX — rendered inside presby's own server process, not a
per-org deployment.

## Status: v3.4.0

**v3.4.0 closes two real gaps found migrating a real congregation's real
site into a content repo** — not a fixture, a real church replacing its
real WordPress site. Both were found the same way v3.1.0–v3.3.0's fixes
were: building against real content surfaced what this package's fixture
testing hadn't.

**`featureGrid`, `valuesGrid`, and `ministryList` gained an optional
per-item image.** Before this release, the only image-carrying blocks were
`hero`, `callout` (image plus a *required* cta), and `staffList`
(per-person `photoUrl`). That's a real gap, not a corner case: a photo
paired with plain text and no button is the single most common non-hero
layout on a real congregation's site, and it had no block that could carry
both. `FeatureGridItem`/`ValuesGridItem`/`MinistryListItem` each gain an
optional `imageUrl`/`imageAlt`, mirroring `StaffPerson.photoUrl`'s existing
pattern exactly — content-authored as an `image` manifestKey, resolved the
same way every other block already resolves one. Not a breaking change: an
item with no image renders exactly as it always has.

**A new `gallery` block** — the multi-image case `hero`/`callout`'s
single image could never cover. Content-authored as
`{ type: "gallery", props: { images: [...] } }`, where each entry is
either a plain manifestKey string or `{ image, alt }`. Renders as a
single-image-at-a-time auto-playing carousel, matching the reference
site's own carousel behavior — but auto-play is never the *only* way to
move through it: a play/pause toggle, pause-on-hover, pause-on-focus, and
a `prefers-reduced-motion` check (auto-play never starts at all when the
visitor's OS requests reduced motion) are all real requirements, not
decoration — uncontrollable auto-advancing content is a WCAG 2.2.2 failure.
`Gallery` is this package's **second** client component, after `Nav`; a
real timer and real play/paused state can't be server-rendered. Every
other piece of this library stays a pure server function.

## Status: v3.3.0

**v3.3.0: `Nav` actually collapses to a hamburger menu under 640px.**
v3.2.0's own narrow-viewport fix only stopped the nav from overflowing —
`Nav` still rendered every link inline and let them wrap, which read as
broken chrome, not a responsive menu. `Nav` is now this package's one
client component (`"use client"` — every other piece stays a pure
server-rendered function): a real `<button>` with `aria-expanded` toggles
`ul[data-open]` between `flex` and `none` at the CSS breakpoint, clicking a
link closes the menu again, and the button itself is CSS-hidden outside
that breakpoint so desktop rendering is unchanged. Because `Nav` is now a
client component, its props changed shape: `NavProps` no longer takes
`pages`/`pageUrl` (a closure can't cross the client boundary) — it takes an
already-resolved `entries: { path, label, href }[]`, computed server-side
by `renderSiteBundle()` exactly as before. `RenderSiteBundleInput` itself
is unchanged; only `Nav`'s own prop shape moved, and this package's own
docs have always described `Nav`/`NavProps` as exposed for testing, not a
second integration surface — `renderSiteBundle()` remains the only contract
presby's own code depends on.

**v3.2.0 fixes two real defects, both found by clicking through a real
fixture site rather than trusting the unit suite alone.**

**Internal links resolved to presby's own site root, not this bundle.**
Every content-authored href that isn't `Nav`'s own page list — a
`FeatureGrid` card, a `Hero`/`Callout` CTA, an `EventList` entry, a
`DonateLink` — was rendered as the raw bundle-relative path the content
repo authored (`/worship`), never passed through the `pageUrl` closure that
`Nav` already used to prefix it (`/site/<slug>/worship`). A visitor clicking
the "Worship" card on the home page landed on presby's own 404 at `/worship`,
while the identical "Worship" link in the nav bar worked, because only `Nav`
had ever been wired to `pageUrl`. `BlockRenderContext` now carries `pageUrl`
too, and every block renderer resolves a `/`-prefixed href through it before
handing it to a component — a `#anchor` or an absolute `http(s)`/`mailto`/
`tel` URL passes through unchanged, exactly as `sanitizeHref` already
classified it. Not a breaking change to this package's own exported types —
`RenderSiteBundleInput` already required `pageUrl`; this release just makes
every block actually use it.

**The stylesheet had zero responsive breakpoints.** `styles.css` (see
v3.1.0 below) rendered correctly wide but had no `@media` query anywhere —
`Nav` wrapped awkwardly and `Callout`'s two-column layout stayed cramped
rather than stacking under ~640px. A `max-width: 640px` block now covers
`Nav` (the "Member Login" button becomes a full-width row instead of an
orphaned pinned-right fragment, and link tap targets grow) and `Callout`
(collapses back to one column, image above text).

**v3.1.1 fixed `Callout`'s own layout**: CSS Grid auto-placement was
wrapping the body paragraph into a second row under the image instead of
beside the heading, because the heading/body/CTA were three flat grid
siblings, not one group. `Callout` now wraps them in a single
`data-slot="content"` element.

**v3.1.0 adds a real stylesheet** — `presby-site-kit/styles.css`. Every
component before this release rendered semantic HTML with no visual styling
at all: no spacing, no typography scale, no card layout, nothing. The
stylesheet is plain CSS, not Tailwind (this package builds independently of
presby's own Tailwind config, which never scans `node_modules` for class
names to generate), and it reads every color from the same CSS custom
properties presby's own `globals.css` always defines (`--primary`,
`--background`, `--card`, `--border`, `--muted-foreground`, `--radius`, ...).
A congregation's own re-declared `--primary` (via `<BrandTokens>`) changes
what a "Plan a visit" button looks like automatically — this stylesheet
never hardcodes a color. presby imports it once, in the layout that already
wraps every page under `/site/<slug>`. Not a breaking change: no type or
function signature changed, only a new file consumers opt into importing.


`renderSiteBundle()` renders a page's typed content blocks (`mdxAst.blocks`)
against a **fixed component allowlist** — `Hero`, `FeatureGrid`, `Callout`,
`ServiceTimes`, `StaffList`, `ValuesGrid`, `MinistryList`, `EventList`,
`SermonEmbed`, `DonateLink`, and `Prose` (constrained Markdown — headings,
paragraphs, lists, links, emphasis; no raw HTML) — plus two pieces of chrome
composed automatically, not block types themselves: `Footer`
(address/phone/hours/social/directions, from the organization's profile
data) below every page's blocks, and `Nav` above them. `Nav` has two
independently-gated pieces: page links, listing every page whose
`frontMatter.navLabel` is set (nothing at all with fewer than two navigable
pages — there's nothing to navigate between), and a "Member Login" link to
presby's own member portal whenever `portalUrl` is set, shown regardless of
how many public pages exist — a one-page site still has members who need to
sign in. An unrecognized block `type`, or a block whose `props` fail
validation, is skipped — never thrown, never rendered as markup — see
`DESIGN-v1-components.md` for the full architecture rationale (typed blocks
instead of MDX-with-embedded-JS, and why that's the trust boundary that
matters for a content repo).

**v3.0.0 is a breaking change from v2.x**: `RenderSiteBundleInput` gains a
required `portalUrl: string | null` field. Unlike `pageUrl`, this isn't a
closure — the member portal (presby's `/o/<slug>`) is a fixed URL per site,
not one that varies per bundle-relative path, so a plain string (or `null`
to omit the login link entirely) is enough. This package never decides who's
signed in; that's presby's own Edge gate's job when a visitor follows the
link.

**v2.0.0 was a breaking change from v1.x**: `RenderSiteBundleInput` gained a
required `pageUrl: (path: string) => string` field, the same
never-assume-a-URL-prefix reasoning `imageUrl` already established — `Nav`
needs it to build real links, and this package still never hardcodes a
`/site/<slug>` prefix itself.

`ContactForm` is intentionally **not** part of this package — it already
exists in presby's own repo and renders separately, below this package's
output. `NewsletterSignup` is out of scope for v1 (see
`DESIGN-v1-components.md`).

See presby's own `docs/decisions.md` → DECISION-086 for why this package
exists as a separate, versioned dependency rather than code living directly
in presby, and `docs/work-log/2026-08-20-public-sites.md` /
`docs/work-log/2026-08-21-public-site-org-profile.md` (in presby's own
repository) for the design this package fulfills.

## Consumability

Compiled output (`dist/`) is checked into every tagged release, not built by
a `prepare`/`postinstall` script — a consumer's `npm install` never invokes
this package's own toolchain. Cut a release by running `npm install && npx
tsc`, committing `dist/`, and tagging.

## No Real Data

This repository, its fixtures, its examples, and its tests must never
contain a real congregation name, person, address, email, or credential —
the same invariant presby's own `CLAUDE.md` states for itself, restated here
explicitly rather than assumed to carry over by proximity.

The per-congregation content repos this package's consumers create
(`site-<slug>`) are the deliberate, explicit exception: real congregation
content — names, photos, service times, addresses — lives there, never here.

## License

MIT
