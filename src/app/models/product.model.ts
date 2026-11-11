export type ProductCategoryId = 'prsluci' | 'jakne' | 'custom';

export interface ProductCategory {
  id: ProductCategoryId;
  label: string;
  /** Short editorial line under the category title */
  intro: string;
}

export type ProductImageKind = 'front' | 'back' | 'side' | 'open' | 'detail';

export interface ProductImage {
  /** Large image (≈1600px) */
  src: string;
  /** Small image (≈760px) used in grids / on mobile */
  srcSm: string;
  alt: string;
  kind: ProductImageKind;
  /** Optional caption shown in the gallery */
  caption?: string;
}

export interface ProductPrice {
  amount: number;
  currency?: string;
  /** e.g. 'od' → "od 25.000 RSD" */
  prefix?: string;
}

export interface Product {
  /** URL-safe unique id: /katalog/:slug */
  slug: string;
  name: string;
  category: ProductCategoryId;
  /** One-line description for cards */
  shortDescription: string;
  /** Longer description for the product page (paragraphs) */
  description: string[];
  /** Only features that are actually visible / confirmed by the workshop */
  features: string[];
  images: ProductImage[];
  /** Optional — shown only when SITE_CONFIG.showPrices is true */
  price?: ProductPrice;
  /** Which measurement definitions apply. Omit = all default measurements. */
  measurementIds?: string[];
  featured?: boolean;
  /** Internal note, never rendered (e.g. where the photo came from) */
  note?: string;
}
