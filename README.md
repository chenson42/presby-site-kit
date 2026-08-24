# presby-site-kit

The shared rendering shell for [presby](https://github.com/chenson42/presby)'s
public congregation websites (`/site/<slug>`). presby imports this package's
one entry point, `renderSiteBundle()`, to turn a normalized content bundle
(front-matter + parsed MDX AST + an image manifest, staged by a content
repo's own CI) into JSX — rendered inside presby's own server process, not a
per-org deployment.

## Status: v3.1.0

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
