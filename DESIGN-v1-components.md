# presby-site-kit v1.0.0 — component library design note

Modeled structurally on a real church's real WordPress site (their current
site, soon to be presby's first live congregation) — never its content. No
real name, address, phone, staff name, or photo from that site appears
anywhere below or in any fixture this design produces. See CLAUDE.md's own
"No Real Data" invariant, restated in this repo's own README for exactly
this reason.

## The one architecture call this design makes, and why

**Content blocks, not MDX-with-embedded-JS.** MDX's whole value proposition
is letting prose embed arbitrary JSX expressions — including arbitrary JS.
That's the wrong trust boundary for a private, congregation-controlled
content repo whose output a stranger's browser will execute inside presby's
own render: a compromised or careless content repo could ship `{fetch(...)}`
or worse directly in a page body. This is the same reasoning
`docs/work-log/2026-08-20-public-sites.md` already used to reject literal
JS-bundle federation between content repos and presby.

Instead: each page's `mdxAst` field (the name stays, for wire-format
stability with the existing bundle contract — `route.ts`'s `validateBundle()`
only checks `"mdxAst" in page`, never its shape) carries a **typed block
array**. A block is `{ type: string, props: Record<string, unknown> }`.
`renderSiteBundle()` looks `type` up against a **fixed component allowlist**
— an unrecognized type is simply skipped and logged, never executed. Prose
itself is just another block type (`type: "prose"`), rendered through a
constrained Markdown-to-React path (heading/paragraph/list/link/emphasis
only — no raw HTML, no script tags) rather than a full MDX compiler. This
keeps the whole system data-only end to end: a content repo can never ship
anything presby's render executes as code, only data presby's own trusted
component set chooses how to draw.

```ts
interface ContentBlock {
  type: string; // checked against ALLOWED_BLOCK_TYPES
  props: Record<string, unknown>;
}
// bundle.pages[].mdxAst = { blocks: ContentBlock[] }
```

`scripts/build-bundle.mjs` (this repo) needs a real change to produce this:
today it ships `{ raw: <mdx body text> }`. A content repo's `.mdx` files
would instead use a small, easy-to-hand-write block syntax — proposing YAML
frontmatter arrays or a minimal fenced-block convention, not real MDX/JSX
parsing, so `build-bundle.mjs` stays dependency-free. Exact syntax is a
build-bundle.mjs implementation detail, not blocking this component design —
flagging it as the next thing to nail down once this component list is
agreed.

## Component inventory

Every one of these maps to something the real reference site actually has.
Prop shapes below are the proposed contract — final types live in
`src/index.tsx` once built.

| Component | Maps to | Props (proposed) |
|---|---|---|
| `Hero` | Homepage hero band | `eyebrow?`, `heading`, `tagline?`, `body?`, `image?` (manifestKey), `cta?: {label, href}` |
| `FeatureGrid` | Homepage's 4-up Worship/Music/Service/Connection cards | `items: {heading, body, href}[]` |
| `Callout` | "Need medical equipment?" program-highlight band | `heading`, `body`, `image?`, `cta: {label, href}` |
| `ServiceTimes` | Nav strip banner + footer "Sundays 10:15 a.m." | no page-level props — reads the new org-profile data (see below), so it's always current without a content-repo edit |
| `StaffList` | Leadership page | `people: {name, title, phone?, email?, photo?}[]` |
| `ValuesGrid` | "Purposeful / Personal / Compassionate" pillars | `items: {heading, body}[]` |
| `MinistryList` | Ministries page's repeated name+description entries | `items: {heading, body}[]` |
| `EventList` | Upcoming Events page | `events: {title, startsAt, endsAt?, location?, href?}[]` (a real calendar/RSVP system is out of scope — this is a flat list, matching what the reference site itself shows) |
| `SermonEmbed` | "Worship Online" watch live/archive | `liveUrl?`, `archiveUrl?` — presby doesn't host video; this links out |
| `ContactForm` | Already built (`ContactForm`, presby's own repo) — upgrade needed | add optional `phone` field and a `subject` dropdown (fixed option list, per-org configurable list is out of scope for v1) |
| `DonateLink` | External "Give" nav item | `label`, `href` — presby does not process payments; this is a styled external link, matching the reference site's own external Vanco link |
| `NewsletterSignup` | Homepage email signup | out of scope for v1 — needs a real destination (mailing list provider or presby's own email queue) and that's a bigger decision than component styling; flagged, not built |
| Footer chrome (address/hours/social/directions) | Every page's footer | not a content block — reads org-profile data directly, same as `ServiceTimes` |

## Org-profile data dependency

`ServiceTimes`, `DonateLink`'s absence-of-a-page-edit, and the footer chrome
all need the organization-level profile fields presby's own schema doesn't
have yet (address, phone, service times, office hours, social links) —
that's `docs/work-log/2026-08-21-public-site-org-profile.md` in presby's own
repo, in progress now. `renderSiteBundle()`'s existing `brand` prop is the
right shape precedent to extend — a `profile` prop alongside it, same
null-safe-by-construction discipline (`profile: null` renders with no
footer contact block rather than throwing), rather than smuggling this data
through page-level frontmatter where every single page would need to repeat
it.

## What doesn't change

`RenderSiteBundleInput`'s existing shape (`pages`, `currentPath`, `brand`,
`imageUrl`) stays — this design adds a `profile` field alongside `brand`,
and changes what `mdxAst` contains, not the function's signature or the
ingest route's contract (`bundle.pages[].mdxAst` stays opaque to
`validateBundle()`, exactly as today).

## Sequencing

1. Org-profile schema lands in presby (separate pipeline, in progress).
2. `renderSiteBundle()` gains the `profile` prop + the block-rendering
   engine + the fixed component allowlist (this repo).
3. `build-bundle.mjs` gains the block-authoring convention (this repo) —
   exact syntax TBD, proposed above as YAML-frontmatter-driven rather than
   real MDX/JSX parsing.
4. Re-stage Alder Creek's synthetic fixture content using the new block
   shapes, confirm visually against a local tunnel test (already proven
   working this session).
