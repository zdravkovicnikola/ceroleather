import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { ProductCatalogComponent } from '../../components/product-catalog/product-catalog.component';
import { CATEGORIES } from '../../data/categories.data';
import { ProductCategoryId } from '../../models/product.model';

@Component({
  selector: 'app-catalog-page',
  imports: [ProductCatalogComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="container catalog-wrap" aria-labelledby="catalog-page-title">
      <h1 id="catalog-page-title" class="visually-hidden">Katalog — CeroLeather kožni prsluci</h1>
      <app-product-catalog [category]="category()" />
    </section>
  `,
  styles: `
    .catalog-wrap {
      padding-top: calc(var(--header-h) + clamp(28px, 4vw, 56px));
      padding-bottom: clamp(100px, 12vw, 180px);
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
