/**
 * SEO built into the framework -- every site rendered through this
 * package gets real metadata by default, not as a per-site opt-in a
 * content author has to remember to wire up.
 */
import type { SiteKitPage } from "./types";
import { asNonEmptyString, isRecord } from "./utils";

export interface BuildPageMetadataInput {
  pages: SiteKitPage[];
  currentPath: string;
  organizationName: string;
  origin: string;
  pageUrl: (path: string) => string;
  logoUrl: string | null;
}

export interface PageMetadata {
  title: string;
  description: string | undefined;
  canonicalUrl: string;
  openGraph: {
    title: string;
    description: string | undefined;
    url: string;
    siteName: string;
    images: { url: string }[];
  };
  twitter: {
    card: "summary" | "summary_large_image";
    title: string;
    description: string | undefined;
  };
  robots: { index: boolean; follow: boolean };
}

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
export function buildPageMetadata(input: BuildPageMetadataInput): PageMetadata {
  const page = input.pages.find((p) => p.path === input.currentPath);
  const fm = page && isRecord(page.frontMatter) ? page.frontMatter : {};
  const pageTitle = asNonEmptyString(fm.title) ?? asNonEmptyString(fm.navLabel);
  const title = pageTitle ? `${pageTitle} | ${input.organizationName}` : input.organizationName;
  const description = asNonEmptyString(fm.description) ?? undefined;
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

export interface SitemapEntry {
  url: string;
  lastModified?: string;
}

/**
 * Only pages that opt into `Nav` (`frontMatter.navLabel` set) are listed
 * -- the same "does this page want to be found" signal `Nav` itself
 * already uses, rather than a second, separate opt-in a content author
 * would have to remember.
 */
export function buildSitemapEntries(
  pages: SiteKitPage[],
  origin: string,
  pageUrl: (path: string) => string,
): SitemapEntry[] {
  return pages.flatMap((page) => {
    const fm = isRecord(page.frontMatter) ? page.frontMatter : {};
    const label = asNonEmptyString(fm.navLabel);
    if (label === null) return [];
    return [{ url: new URL(pageUrl(page.path), origin).toString() }];
  });
}
