import type { SiteKitPage } from "./types";
/**
 * Site-wide settings (v4.5.0): one optional `site` object in the frontMatter
 * of the page whose `path` is "/", applied to every page. Every key is
 * optional and opt-in: a site with no `/` page, or no `site` key, renders
 * exactly as it did before v4.5.0.
 *
 * ```json
 * "site": {
 *   "footerLine": "A presbytery of the Presbyterian Church (U.S.A.)",
 *   "footerLinks": [{ "label": "Contact us", "href": "https://example.invalid/contact" }],
 *   "copyrightHolder": true,
 *   "organization": {
 *     "legalName": "Example Presbytery",
 *     "taxId": "00-0000000",
 *     "nonprofitStatus": "Nonprofit501c3",
 *     "parentOrganization": { "name": "Example Church", "url": "https://example.invalid" },
 *     "sameAs": ["https://example.invalid"]
 *   }
 * }
 * ```
 *
 * Unknown keys and malformed values are dropped, never thrown.
 */
export interface FooterLink {
    label: string;
    href: string;
}
export interface SiteOrganization {
    legalName: string | null;
    taxId: string | null;
    nonprofitStatus: string | null;
    parentOrganization: {
        name: string;
        url: string | null;
    } | null;
    sameAs: string[];
}
export interface SiteSettings {
    footerLine: string | null;
    footerLinks: FooterLink[];
    /** `true` = the organization's own name; a string overrides it. */
    copyrightHolder: true | string | null;
    /** Present only when the content opted into structured data. */
    organization: SiteOrganization | null;
}
export declare const EMPTY_SITE_SETTINGS: SiteSettings;
/** Absolute https only -- no relative, protocol-relative or other schemes. */
export declare function asHttpsUrl(value: unknown): string | null;
/** `NN-NNNNNNN` or nine digits, normalized to `NN-NNNNNNN`; else null. */
export declare function normalizeEin(value: unknown): string | null;
export declare function siteSettingsFor(pages: SiteKitPage[]): SiteSettings;
/** Lines of a free-text address, as entered (LF-separated). */
export declare function addressLines(address: string): string[];
/** One-line form: lines joined with ", " without doubling a trailing comma. */
export declare function addressOneLine(address: string): string;
