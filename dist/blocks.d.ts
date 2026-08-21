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
    profile: RenderSiteBundleProfile | null;
    headingClassName?: string;
}
type BlockRenderer = (props: Record<string, unknown>, ctx: BlockRenderContext) => ReactElement | null;
export declare const BLOCK_REGISTRY: Record<string, BlockRenderer>;
/** Every block `type` this release recognizes — anything else is skipped
 * by `renderSiteBundle()`, never rendered, never executed. */
export declare const ALLOWED_BLOCK_TYPES: readonly string[];
export {};
