import { RenderMode, ServerRoute } from '@angular/ssr';
import { PRODUCTS } from './data/products.data';

/**
 * Static Site Generation (SSG): every public page is prerendered to its own HTML file at
 * build time (`ng build`), so search engines and social previews get full content and
 * metadata without running JavaScript. In the browser the app then hydrates and behaves as before.
 *
 * Adding a product to products.data.ts automatically adds its prerendered page.
 */
export const serverRoutes: ServerRoute[] = [
  { path: '', renderMode: RenderMode.Prerender },
  { path: 'katalog', renderMode: RenderMode.Prerender },
  {
    path: 'katalog/:slug',
    renderMode: RenderMode.Prerender,
    getPrerenderParams: async () => PRODUCTS.map((p) => ({ slug: p.slug })),
  },
  { path: 'o-nama', renderMode: RenderMode.Prerender },
  { path: 'porudzbina', renderMode: RenderMode.Prerender },
  // Unknown URLs: served by the client-side shell (index.csr.html) → "Stranica nije pronađena"
  { path: '**', renderMode: RenderMode.Client },
];
