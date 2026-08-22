# presby-site-kit

The shared rendering shell for [presby](https://github.com/chenson42/presby)'s
public congregation websites (`/site/<slug>`). presby imports this package's
one entry point, `renderSiteBundle()`, to turn a normalized content bundle
(front-matter + parsed MDX AST + an image manifest, staged by a content
repo's own CI) into JSX — rendered inside presby's own server process, not a
per-org deployment.

## Status: v2.0.0

`renderSiteBundle()` renders a page's typed content blocks (`mdxAst.blocks`)
against a **fixed component allowlist** — `Hero`, `FeatureGrid`, `Callout`,
`ServiceTimes`, `StaffList`, `ValuesGrid`, `MinistryList`, `EventList`,
`SermonEmbed`, `DonateLink`, and `Prose` (constrained Markdown — headings,
paragraphs, lists, links, emphasis; no raw HTML) — plus two pieces of chrome
composed automatically, not block types themselves: `Footer`
(address/phone/hours/social/directions, from the organization's profile
data) below every page's blocks, and `Nav` above them, listing every page
whose `frontMatter.navLabel` is set (a page with none is left out; the whole
`Nav` renders nothing with fewer than two navigable pages — there's nothing
to navigate between). An unrecognized block `type`, or a block whose `props`
fail validation, is skipped — never thrown, never rendered as markup — see
`DESIGN-v1-components.md` for the full architecture rationale (typed blocks
instead of MDX-with-embedded-JS, and why that's the trust boundary that
matters for a content repo).

**v2.0.0 is a breaking change from v1.x**: `RenderSiteBundleInput` gains a
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
