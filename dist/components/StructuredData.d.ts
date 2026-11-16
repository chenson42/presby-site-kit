import type { ReactElement } from "react";
import type { RenderSiteBundleProfile } from "../types";
import { type SiteOrganization } from "../site-settings";
export interface StructuredDataProps {
    organization: SiteOrganization;
    /** From the portal, never from content. */
    organizationName: string;
    /** The site's canonical home URL, built from the caller's origin. */
    url: string | null;
    profile: RenderSiteBundleProfile | null;
    logoUrl: string | null;
}
/**
 * Serialize for an inline `<script type="application/ld+json">`: `<`, `>`
 * and `&` become unicode escapes so no string can close the element
 * (`</script>`) or open a comment, and U+2028/U+2029 are escaped for old
 * JavaScript parsers. The result is still valid JSON.
 */
export declare function serializeJsonLd(value: unknown): string;
export declare function buildOrganizationJsonLd({ organization, organizationName, url, profile, logoUrl, }: StructuredDataProps): Record<string, unknown>;
/**
 * schema.org Organization data for search engines, on the home page only.
 *
 * The ONE `dangerouslySetInnerHTML` in this package: React entity-escapes a
 * script's children, which breaks JSON, so the only way to emit JSON-LD is
 * a raw string. It is safe because the string is `serializeJsonLd` output
 * of an object built field-by-field from validated values -- never content
 * markup, never a spread of content.
 */
export declare function StructuredData(props: StructuredDataProps): ReactElement;
