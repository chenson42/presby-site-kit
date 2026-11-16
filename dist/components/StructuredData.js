"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.serializeJsonLd = serializeJsonLd;
exports.buildOrganizationJsonLd = buildOrganizationJsonLd;
exports.StructuredData = StructuredData;
const jsx_runtime_1 = require("react/jsx-runtime");
const site_settings_1 = require("../site-settings");
/**
 * Serialize for an inline `<script type="application/ld+json">`: `<`, `>`
 * and `&` become unicode escapes so no string can close the element
 * (`</script>`) or open a comment, and U+2028/U+2029 are escaped for old
 * JavaScript parsers. The result is still valid JSON.
 */
function serializeJsonLd(value) {
    return JSON.stringify(value)
        .replace(/</g, "\\u003c")
        .replace(/>/g, "\\u003e")
        .replace(/&/g, "\\u0026")
        .replace(/\u2028/g, "\\u2028")
        .replace(/\u2029/g, "\\u2029");
}
function buildOrganizationJsonLd({ organization, organizationName, url, profile, logoUrl, }) {
    // Built from named fields only -- content is never spread in.
    const data = {
        "@context": "https://schema.org",
        "@type": "Organization",
        name: organizationName,
    };
    if (organization.legalName)
        data.legalName = organization.legalName;
    if (url)
        data.url = url;
    if (logoUrl && url) {
        try {
            data.logo = new URL(logoUrl, url).toString();
        }
        catch {
            // A logo URL that can't be made absolute is left out.
        }
    }
    if (profile?.address) {
        data.address = { "@type": "PostalAddress", streetAddress: (0, site_settings_1.addressOneLine)(profile.address) };
    }
    if (profile?.phone)
        data.telephone = profile.phone.trim();
    if (organization.taxId)
        data.taxID = organization.taxId;
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
    if (organization.sameAs.length > 0)
        data.sameAs = organization.sameAs;
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
function StructuredData(props) {
    return ((0, jsx_runtime_1.jsx)("script", { type: "application/ld+json", 
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML: { __html: serializeJsonLd(buildOrganizationJsonLd(props)) } }));
}
