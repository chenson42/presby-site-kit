"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EMPTY_SITE_SETTINGS = void 0;
exports.asHttpsUrl = asHttpsUrl;
exports.normalizeEin = normalizeEin;
exports.siteSettingsFor = siteSettingsFor;
exports.addressLines = addressLines;
exports.addressOneLine = addressOneLine;
const utils_1 = require("./utils");
exports.EMPTY_SITE_SETTINGS = {
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
function boundedString(value, max) {
    const s = (0, utils_1.asNonEmptyString)(value);
    if (s === null)
        return null;
    const trimmed = s.trim();
    return trimmed.length > 0 && trimmed.length <= max ? trimmed : null;
}
/** Absolute https only -- no relative, protocol-relative or other schemes. */
function asHttpsUrl(value) {
    const s = (0, utils_1.asNonEmptyString)(value);
    if (s === null)
        return null;
    try {
        const url = new URL(s.trim());
        return url.protocol === "https:" ? url.toString() : null;
    }
    catch {
        return null;
    }
}
/** Footer links: absolute https, mailto: or tel: only. */
function asFooterHref(value) {
    const s = (0, utils_1.asNonEmptyString)(value);
    if (s === null)
        return null;
    const trimmed = s.trim();
    if (trimmed.startsWith("/"))
        return null;
    try {
        const url = new URL(trimmed);
        return url.protocol === "https:" || url.protocol === "mailto:" || url.protocol === "tel:"
            ? trimmed
            : null;
    }
    catch {
        return null;
    }
}
/** `NN-NNNNNNN` or nine digits, normalized to `NN-NNNNNNN`; else null. */
function normalizeEin(value) {
    const s = (0, utils_1.asNonEmptyString)(value);
    if (s === null)
        return null;
    const match = /^(\d{2})-?(\d{7})$/.exec(s.trim());
    return match ? `${match[1]}-${match[2]}` : null;
}
function parseOrganization(value) {
    if (!(0, utils_1.isRecord)(value))
        return null;
    const parent = (0, utils_1.isRecord)(value.parentOrganization)
        ? (() => {
            const name = boundedString(value.parentOrganization.name, MAX_NAME);
            return name ? { name, url: asHttpsUrl(value.parentOrganization.url) } : null;
        })()
        : null;
    const status = (0, utils_1.asNonEmptyString)(value.nonprofitStatus);
    return {
        legalName: boundedString(value.legalName, MAX_NAME),
        taxId: normalizeEin(value.taxId),
        nonprofitStatus: status && NONPROFIT_STATUSES.has(status) ? status : null,
        parentOrganization: parent,
        sameAs: Array.isArray(value.sameAs)
            ? value.sameAs
                .map(asHttpsUrl)
                .filter((u) => u !== null)
                .slice(0, MAX_SAME_AS)
            : [],
    };
}
function siteSettingsFor(pages) {
    const home = pages.find((p) => p.path === "/");
    const fm = home && (0, utils_1.isRecord)(home.frontMatter) ? home.frontMatter : null;
    const site = fm && (0, utils_1.isRecord)(fm.site) ? fm.site : null;
    if (!site)
        return exports.EMPTY_SITE_SETTINGS;
    const footerLinks = Array.isArray(site.footerLinks)
        ? site.footerLinks
            .flatMap((link) => {
            if (!(0, utils_1.isRecord)(link))
                return [];
            const label = boundedString(link.label, MAX_LINK_LABEL);
            const href = asFooterHref(link.href);
            return label && href ? [{ label, href }] : [];
        })
            .slice(0, MAX_FOOTER_LINKS)
        : [];
    const holder = site.copyrightHolder === true ? true : boundedString(site.copyrightHolder, MAX_NAME);
    return {
        footerLine: boundedString(site.footerLine, MAX_FOOTER_LINE),
        footerLinks,
        copyrightHolder: holder,
        organization: parseOrganization(site.organization),
    };
}
/** Lines of a free-text address, as entered (LF-separated). */
function addressLines(address) {
    return address
        .split(/\r\n|\r|\n|\u2028|\u2029/)
        .map((line) => line.trim())
        .filter((line) => line.length > 0);
}
/** One-line form: lines joined with ", " without doubling a trailing comma. */
function addressOneLine(address) {
    return addressLines(address)
        .map((line) => line.replace(/,+$/, ""))
        .join(", ");
}
