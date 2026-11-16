import type { ReactElement } from "react";
import type { RenderSiteBundleProfile } from "../types";
import { addressOneLine, type SiteOrganization } from "../site-settings";

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
export function serializeJsonLd(value: unknown): string {
  return JSON.stringify(value)
    .replace(/</g, "\\u003c")
    .replace(/>/g, "\\u003e")
    .replace(/&/g, "\\u0026")
    .replace(/\u2028/g, "\\u2028")
    .replace(/\u2029/g, "\\u2029");
}

export function buildOrganizationJsonLd({
  organization,
  organizationName,
  url,
  profile,
  logoUrl,
}: StructuredDataProps): Record<string, unknown> {
  // Built from named fields only -- content is never spread in.
  const data: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: organizationName,
  };
  if (organization.legalName) data.legalName = organization.legalName;
  if (url) data.url = url;
  if (logoUrl && url) {
    try {
      data.logo = new URL(logoUrl, url).toString();
    } catch {
      // A logo URL that can't be made absolute is left out.
    }
  }
  if (profile?.address) {
    data.address = { "@type": "PostalAddress", streetAddress: addressOneLine(profile.address) };
  }
  if (profile?.phone) data.telephone = profile.phone.trim();
  if (organization.taxId) data.taxID = organization.taxId;
  if (organization.nonprofitStatus) {
    data.nonprofitStatus = `https://schema.org/${organization.nonprofitStatus}`;
  }
  if (organization.parentOrganization) {
    data.parentOrganization = {
      "@type": "Organization",
      name: organization.parentOrganization.name,
      ...(organization.parentOrganization.url ? { url: organization.parentOrganization.url } : {}),
    };
  }
  if (organization.sameAs.length > 0) data.sameAs = organization.sameAs;
  return data;
}

/**
 * schema.org Organization data for search engines, on the home page only.
 *
 * The ONE `dangerouslySetInnerHTML` in this package: React entity-escapes a
 * script's children, which breaks JSON, so the only way to emit JSON-LD is
 * a raw string. It is safe because the string is `serializeJsonLd` output
 * of an object built field-by-field from validated values -- never content
 * markup, never a spread of content.
 */
export function StructuredData(props: StructuredDataProps): ReactElement {
  return (
    <script
      type="application/ld+json"
      // eslint-disable-next-line react/no-danger
      dangerouslySetInnerHTML={{ __html: serializeJsonLd(buildOrganizationJsonLd(props)) }}
    />
  );
}
