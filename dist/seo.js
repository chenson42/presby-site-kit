"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildPageMetadata = buildPageMetadata;
exports.buildSitemapEntries = buildSitemapEntries;
const utils_1 = require("./utils");
/**
 * A page's own `frontMatter.navLabel` (or, absent that, `frontMatter.title`)
 * becomes its title, suffixed with the organization's own name -- never
 * platform branding (presby's root layout template is deliberately
 * bypassed by the caller for exactly this reason). `frontMatter.description`
 * is optional; when unset, `description` is omitted rather than a generic
 * filler string. A page whose `path` isn't found in `pages` (a genuinely
 * unreachable case in practice -- `renderSiteBundle` already 404s first)
 * still returns a metadata object built from just the organization name,
 * never throws.
 */
function buildPageMetadata(input) {
    const page = input.pages.find((p) => p.path === input.currentPath);
    const fm = page && (0, utils_1.isRecord)(page.frontMatter) ? page.frontMatter : {};
    const pageTitle = (0, utils_1.asNonEmptyString)(fm.title) ?? (0, utils_1.asNonEmptyString)(fm.navLabel);
    const title = pageTitle ? `${pageTitle} | ${input.organizationName}` : input.organizationName;
    const description = (0, utils_1.asNonEmptyString)(fm.description) ?? undefined;
    const canonicalUrl = new URL(input.pageUrl(input.currentPath), input.origin).toString();
    return {
        title,
        description,
        canonicalUrl,
        openGraph: {
            title,
            description,
            url: canonicalUrl,
            siteName: input.organizationName,
            images: input.logoUrl ? [{ url: input.logoUrl }] : [],
        },
        twitter: {
            card: "summary",
            title,
            description,
        },
        robots: { index: true, follow: true },
    };
}
/**
 * Only pages that opt into `Nav` (`frontMatter.navLabel` set) are listed
 * -- the same "does this page want to be found" signal `Nav` itself
 * already uses, rather than a second, separate opt-in a content author
 * would have to remember.
 */
function buildSitemapEntries(pages, origin, pageUrl) {
    return pages.flatMap((page) => {
        const fm = (0, utils_1.isRecord)(page.frontMatter) ? page.frontMatter : {};
        const label = (0, utils_1.asNonEmptyString)(fm.navLabel);
        if (label === null)
            return [];
        return [{ url: new URL(pageUrl(page.path), origin).toString() }];
    });
}
