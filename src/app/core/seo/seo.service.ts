import { DOCUMENT } from '@angular/common';
import { Injectable, inject } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';
import { ActivatedRouteSnapshot } from '@angular/router';
import { environment } from '../../../environments/environment';
import { SITE_CONFIG } from '../config/site.config';

export interface SeoData {
  /** Full <title>. Keep it under ~60 characters. */
  title: string;
  /** Meta description, ~140–160 characters, Serbian */
  description: string;
  /** Path for the canonical URL, e.g. "/katalog". Defaults to the current path without query. */
  path?: string;
  /** Social sharing image (relative to the site root) */
  image?: string;
  imageAlt?: string;
  type?: 'website' | 'product' | 'article';
  /** Exclude from search results (404, etc.) */
  noindex?: boolean;
  /** Structured data objects (schema.org) to embed as JSON-LD */
  jsonLd?: object[];
}

/** Route `data` key. Routes whose page sets its own SEO (product detail) use `seoManaged: true`. */
export const SEO_KEY = 'seo';

const DEFAULT_IMAGE = 'assets/images/products/strap-vest-side.webp';

/**
 * Page-level SEO: title, description, robots, canonical, Open Graph, Twitter and JSON-LD.
 * Runs during prerendering too, so every static HTML file ships with complete metadata.
 */
@Injectable({ providedIn: 'root' })
export class SeoService {
  private readonly title = inject(Title);
  private readonly meta = inject(Meta);
  private readonly doc = inject(DOCUMENT);

  readonly siteUrl = environment.siteUrl.replace(/\/$/, '');

  /** Absolute URL for a site path or asset */
  absolute(path: string): string {
    if (/^https?:\/\//.test(path)) return path;
    const clean = path.replace(/^\/+/, '').replace(/\/+$/, '');
    return clean ? `${this.siteUrl}/${clean}` : `${this.siteUrl}/`;
  }

  /** Applies `data.seo` of the deepest activated route (called on every NavigationEnd). */
  applyRouteData(root: ActivatedRouteSnapshot, url: string): void {
    let r: ActivatedRouteSnapshot | null = root;
    let data: SeoData | undefined;
    let managed = false;
    while (r) {
      if (r.data[SEO_KEY]) data = r.data[SEO_KEY] as SeoData;
      if (r.data['seoManaged']) managed = true;
      r = r.firstChild;
    }
    if (managed) return; // the page sets its own metadata
    const path = url.split(/[?#]/)[0] || '/';
    this.update({ ...(data ?? FALLBACK_SEO), path: data?.path ?? path });
  }

  update(seo: SeoData): void {
    const canonical = this.absolute(seo.path ?? '/');
    const image = this.absolute(seo.image ?? DEFAULT_IMAGE);

    this.title.setTitle(seo.title);
    this.setName('description', seo.description);
    this.setName(
      'robots',
      seo.noindex ? 'noindex, follow' : 'index, follow, max-image-preview:large',
    );

    this.setProperty('og:site_name', SITE_CONFIG.brandName);
    this.setProperty('og:locale', 'sr_RS');
    this.setProperty(
      'og:type',
      seo.type === 'product' ? 'product' : seo.type === 'article' ? 'article' : 'website',
    );
    this.setProperty('og:title', seo.title);
    this.setProperty('og:description', seo.description);
    this.setProperty('og:url', canonical);
    this.setProperty('og:image', image);
    this.setProperty('og:image:alt', seo.imageAlt ?? seo.title);
    this.setName('twitter:card', 'summary_large_image');
    this.setName('twitter:title', seo.title);
    this.setName('twitter:description', seo.description);
    this.setName('twitter:image', image);

    this.setCanonical(seo.noindex ? null : canonical);
    this.setJsonLd([organizationLd(this), ...(seo.jsonLd ?? [])]);
  }

  // ---------------------------------------------------------------------------

  private setName(name: string, content: string): void {
    this.meta.updateTag({ name, content }, `name="${name}"`);
  }

  private setProperty(property: string, content: string): void {
    this.meta.updateTag({ property, content }, `property="${property}"`);
  }

  private setCanonical(href: string | null): void {
    let link = this.doc.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    if (!href) {
      link?.remove();
      return;
    }
    if (!link) {
      link = this.doc.createElement('link');
      link.setAttribute('rel', 'canonical');
      this.doc.head.appendChild(link);
    }
    link.setAttribute('href', href);
  }

  private setJsonLd(items: object[]): void {
    this.doc.head.querySelectorAll('script[data-seo="ld"]').forEach((s) => s.remove());
    for (const item of items) {
      const script = this.doc.createElement('script');
      script.setAttribute('type', 'application/ld+json');
      script.setAttribute('data-seo', 'ld');
      // escape "<" so content can never close the script tag
      script.textContent = JSON.stringify(item).replace(/</g, '\\u003c');
      this.doc.head.appendChild(script);
    }
  }
}

/** Organization — only facts we actually know (name, site, logo, Instagram). */
function organizationLd(seo: SeoService): object {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    '@id': `${seo.siteUrl}/#organization`,
    name: SITE_CONFIG.brandName,
    url: `${seo.siteUrl}/`,
    logo: seo.absolute('favicon.svg'),
    sameAs: [SITE_CONFIG.instagramUrl],
  };
}

export function breadcrumbLd(
  seo: SeoService,
  items: Array<{ name: string; path: string }>,
): object {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((it, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: it.name,
      item: seo.absolute(it.path),
    })),
  };
}

const FALLBACK_SEO: SeoData = {
  title: 'CeroLeather — ručno izrađeni kožni prsluci i jakne po meri',
  description:
    'CeroLeather — ručno izrađeni kožni motociklistički prsluci i jakne, kreirani po vašoj meri. Pogledajte modele i pošaljite zahtev za porudžbinu.',
};
