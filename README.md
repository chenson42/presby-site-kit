# presby-site-kit

The shared rendering shell for [presby](https://github.com/chenson42/presby)'s
public congregation websites (`/site/<slug>`). presby imports this package's
one entry point, `renderSiteBundle()`, to turn a normalized content bundle
(front-matter + parsed MDX AST + an image manifest, staged by a content
repo's own CI) into JSX — rendered inside presby's own server process, not a
per-org deployment.

## Status: v0.0.1-stub

This release is a **stub**, created to give presby's public-site render path
a real, npm-resolvable dependency to build and test against — not a locally
shadowed fake package name. It ignores `mdxAst` and any component allowlist
entirely; it renders each page's front-matter `title` (if present) plus a
"Content coming soon" placeholder. See presby's own
`docs/decisions.md` → DECISION-086 for the full reasoning, and
`docs/work-log/2026-08-20-public-sites.md` (in presby's repository) for the
design this package fulfills one small piece of.

A later, separate release (tagged `v1.0.0+`) will implement the real,
allowlisted MDX component library (`Hero`, `ServiceTimes`, `StaffList`,
`EventList`, `SermonEmbed`, `ContactForm`, `DonateLink`, base MDX prose) plus
the reusable GitHub Actions workflow (validation, normalization, staging)
every `site-<slug>` content repo inherits. presby's consuming code does not
change shape when that happens — only the pinned git tag in presby's own
`package.json`.

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
