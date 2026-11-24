/** Catalog filters. Reclassify a product by changing its `category` in products.data.ts. */
export type ProductCategoryId = 'muski' | 'zenski' | 'custom';

export interface ProductCategory {
  id: ProductCategoryId;
  label: string;
  /** Optional short editorial line shown under the filters when the category is active */
  intro?: string;
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
  /** true = cut-out on a transparent background (shown directly on the catalog's leather) */
  cutout?: boolean;
}

export interface ProductPrice {
  amount: number;
  /** Upper bound for a price range, e.g. 13000 → "13 000–14 000 RSD" */
  amountMax?: number;
  currency?: string;
  /** e.g. 'od' → "od 25.000 RSD" */
  prefix?: string;
}

/** Full amount, non-breaking space as thousands separator: "7 500 RSD", "13 000–14 000 RSD" */
export function formatPrice(pr: ProductPrice, defaultCurrency: string): string {
  const fmt = (n: number) => String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  const amount = pr.amountMax ? `${fmt(pr.amount)}–${fmt(pr.amountMax)}` : fmt(pr.amount);
  return [pr.prefix, amount, pr.currency ?? defaultCurrency].filter(Boolean).join(' ');
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
  /** Heading above `features` on the product page (default "Detalji modela") */
  featuresTitle?: string;
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
