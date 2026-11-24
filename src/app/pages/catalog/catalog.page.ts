import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { ProductCatalogComponent } from '../../components/product-catalog/product-catalog.component';
import { CATEGORIES } from '../../data/categories.data';
import { ProductCategoryId } from '../../models/product.model';

@Component({
  selector: 'app-catalog-page',
  imports: [ProductCatalogComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="catalog-stage" aria-labelledby="catalog-page-title">
      <div class="container catalog-wrap">
        <h1 id="catalog-page-title" class="visually-hidden">Katalog — CeroLeather kožni prsluci</h1>
        <app-product-catalog [category]="category()" />
      </div>
    </section>
  `,
  styles: `
    /*
     * Black-leather stage behind the whole product listing, built only from the site's existing
     * leather texture (assets/images/textures/leather-grain.webp):
     *  - folds: that texture stretched once over the whole stage (no tiling → no seams)
     *  - grain: leather-grain-seamless.webp — the same texture's fine grain, made tileable
     *    (large shading removed, borders cross-faded), overlay-blended on top
     * Light falls softly on the middle, the edges sink into shadow, top/bottom blend into the page.
     */
    .catalog-stage {
      position: relative;
      isolation: isolate;
      overflow: hidden;
      background-color: #0c0c0c;
    }
    /* folds + light: the stretched texture, blurred so only the soft folds remain (no enlarged grain) */
    .catalog-stage::before {
      content: '';
      position: absolute;
      inset: -40px;
      z-index: -2;
      background:
        radial-gradient(ellipse 60% 40% at 50% 30%, rgba(255, 255, 255, 0.07), transparent 70%),
        radial-gradient(ellipse 120% 90% at 50% 45%, transparent 45%, rgba(0, 0, 0, 0.65) 100%),
        linear-gradient(180deg, var(--bg) 0%, transparent 14%, transparent 86%, var(--bg) 100%),
        url('/assets/images/textures/leather-grain.webp') center top / cover no-repeat;
      filter: blur(14px) brightness(0.62);
    }
    /* fine grain on top: seamless tile, overlay-blended, subtle */
    .catalog-stage::after {
      content: '';
      position: absolute;
      inset: 0;
      z-index: -1;
      pointer-events: none;
      background: url('/assets/images/textures/leather-grain-seamless.webp') 0 0 / 420px repeat;
      mix-blend-mode: overlay;
      opacity: 0.55;
    }
    .catalog-wrap {
      padding-top: calc(var(--header-h) + clamp(36px, 5vw, 72px));
      padding-bottom: clamp(100px, 12vw, 180px);
    }
    @media (max-width: 760px) {
      .catalog-stage::after {
        background-size: 300px;
      }
    }
  `,
})
export class CatalogPage {
  /** Bound from the ?kategorija= query param */
  readonly kategorija = input<string | undefined>();
  readonly category = computed<ProductCategoryId | null>(() => {
    const k = this.kategorija();
    return CATEGORIES.some((c) => c.id === k) ? (k as ProductCategoryId) : null;
  });
}
