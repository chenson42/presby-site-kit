import type { ReactElement } from "react";
import type { RenderSiteBundleProfile } from "./types";
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
    /** The caller's already-built interactive contact-form element — see
     * RenderSiteBundleInput's own `contactForm` field in ../index.tsx for
     * the full "this package renders no forms of its own" rationale. */
    contactForm?: ReactElement;
}
type BlockRenderer = (props: Record<string, unknown>, ctx: BlockRenderContext) => ReactElement | null;
export declare const BLOCK_REGISTRY: Record<string, BlockRenderer>;
/** Every block `type` this release recognizes — anything else is skipped
 * by `renderSiteBundle()`, never rendered, never executed. */
export declare const ALLOWED_BLOCK_TYPES: readonly string[];
export {};
