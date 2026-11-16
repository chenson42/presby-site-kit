import type { SiteKitPage } from "./types";
import { asNonEmptyString, isRecord } from "./utils";

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
  parentOrganization: { name: string; url: string | null } | null;
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

export const EMPTY_SITE_SETTINGS: SiteSettings = {
  footerLine: null,
  footerLinks: [],
  copyrightHolder: null,
  organization: null,
};

const MAX_FOOTER_LINE = 200;
const MAX_FOOTER_LINKS = 4;
const MAX_LINK_LABEL = 60;
const MAX_NAME = 200;
const MAX_SAME_AS = 5;

/** schema.org NonprofitType enumeration members (US + a few others). */
const NONPROFIT_STATUSES = new Set([
  "Nonprofit501a",
  "Nonprofit501c1",
  "Nonprofit501c2",
  "Nonprofit501c3",
  "Nonprofit501c4",
  "Nonprofit501c5",
  "Nonprofit501c6",
  "Nonprofit501c7",
  "Nonprofit501c8",
  "Nonprofit501c9",
  "Nonprofit501c10",
  "Nonprofit501c11",
  "Nonprofit501c12",
  "Nonprofit501c13",
  "Nonprofit501c14",
  "Nonprofit501c15",
  "Nonprofit501c16",
  "Nonprofit501c17",
  "Nonprofit501c18",
  "Nonprofit501c19",
  "Nonprofit501c20",
  "Nonprofit501c21",
  "Nonprofit501c22",
  "Nonprofit501c23",
  "Nonprofit501c24",
  "Nonprofit501c25",
  "Nonprofit501c26",
  "Nonprofit501c27",
  "Nonprofit501c28",
  "Nonprofit501d",
  "Nonprofit501e",
  "Nonprofit501f",
  "Nonprofit501k",
  "Nonprofit501n",
  "Nonprofit501q",
  "Nonprofit527",
]);

function boundedString(value: unknown, max: number): string | null {
  const s = asNonEmptyString(value);
  if (s === null) return null;
  const trimmed = s.trim();
  return trimmed.length > 0 && trimmed.length <= max ? trimmed : null;
}

/** Absolute https only -- no relative, protocol-relative or other schemes. */
export function asHttpsUrl(value: unknown): string | null {
  const s = asNonEmptyString(value);
  if (s === null) return null;
  try {
    const url = new URL(s.trim());
    return url.protocol === "https:" ? url.toString() : null;
  } catch {
    return null;
  }
}

/** Footer links: absolute https, mailto: or tel: only. */
function asFooterHref(value: unknown): string | null {
  const s = asNonEmptyString(value);
  if (s === null) return null;
  const trimmed = s.trim();
  if (trimmed.startsWith("/")) return null;
  try {
    const url = new URL(trimmed);
    return url.protocol === "https:" || url.protocol === "mailto:" || url.protocol === "tel:"
      ? trimmed
      : null;
  } catch {
    return null;
  }
}

/** `NN-NNNNNNN` or nine digits, normalized to `NN-NNNNNNN`; else null. */
export function normalizeEin(value: unknown): string | null {
  const s = asNonEmptyString(value);
  if (s === null) return null;
  const match = /^(\d{2})-?(\d{7})$/.exec(s.trim());
  return match ? `${match[1]}-${match[2]}` : null;
}

function parseOrganization(value: unknown): SiteOrganization | null {
  if (!isRecord(value)) return null;
  const parent = isRecord(value.parentOrganization)
    ? (() => {
        const name = boundedString(value.parentOrganization.name, MAX_NAME);
        return name ? { name, url: asHttpsUrl(value.parentOrganization.url) } : null;
      })()
    : null;
  const status = asNonEmptyString(value.nonprofitStatus);
  return {
    legalName: boundedString(value.legalName, MAX_NAME),
    taxId: normalizeEin(value.taxId),
    nonprofitStatus: status && NONPROFIT_STATUSES.has(status) ? status : null,
    parentOrganization: parent,
    sameAs: Array.isArray(value.sameAs)
      ? value.sameAs
          .map(asHttpsUrl)
          .filter((u): u is string => u !== null)
          .slice(0, MAX_SAME_AS)
      : [],
  };
}

export function siteSettingsFor(pages: SiteKitPage[]): SiteSettings {
  const home = pages.find((p) => p.path === "/");
  const fm = home && isRecord(home.frontMatter) ? home.frontMatter : null;
  const site = fm && isRecord(fm.site) ? fm.site : null;
  if (!site) return EMPTY_SITE_SETTINGS;

  const footerLinks = Array.isArray(site.footerLinks)
    ? site.footerLinks
        .flatMap((link) => {
          if (!isRecord(link)) return [];
          const label = boundedString(link.label, MAX_LINK_LABEL);
          const href = asFooterHref(link.href);
          return label && href ? [{ label, href }] : [];
        })
        .slice(0, MAX_FOOTER_LINKS)
    : [];

  const holder =
    site.copyrightHolder === true ? true : boundedString(site.copyrightHolder, MAX_NAME);

  return {
    footerLine: boundedString(site.footerLine, MAX_FOOTER_LINE),
    footerLinks,
    copyrightHolder: holder,
    organization: parseOrganization(site.organization),
  };
}

/** Lines of a free-text address, as entered (LF-separated). */
export function addressLines(address: string): string[] {
  return address
    .split(/\r\n|\r|\n|\u2028|\u2029/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0);
}

/** One-line form: lines joined with ", " without doubling a trailing comma. */
export function addressOneLine(address: string): string {
  return addressLines(address)
    .map((line) => line.replace(/,+$/, ""))
    .join(", ");
}
