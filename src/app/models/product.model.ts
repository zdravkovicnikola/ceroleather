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

/**
 * Frame sequence for the interactive 360° viewer (NOT a 3D model — a series of
 * images taken at evenly spaced angles around the product).
 * Files: `${path}/00.webp … ${path}/NN.webp` (large) and `NN-sm.webp` (small, phones).
 */
export interface ProductSpin360 {
  path: string;
  frames: number;
  /** Pixel size of the large / small square frames */
  size: number;
  sizeSm: number;
  /** +1 if increasing frame index rotates the product to its left (clockwise seen from above) */
  direction?: 1 | -1;
  alt: string;
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
  /** Optional interactive 360° frame sequence */
  spin360?: ProductSpin360;
  /** Optional — shown only when SITE_CONFIG.showPrices is true */
  price?: ProductPrice;
  /** Which measurement definitions apply. Omit = all default measurements. */
  measurementIds?: string[];
  featured?: boolean;
  /** Internal note, never rendered (e.g. where the photo came from) */
  note?: string;
}
