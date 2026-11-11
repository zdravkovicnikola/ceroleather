import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CATEGORIES } from '../../data/categories.data';
import { PRODUCTS } from '../../data/products.data';
import { ProductCategoryId } from '../../models/product.model';
import { RevealDirective } from '../../shared/directives/reveal.directive';
import { ProductCardComponent } from '../product-card/product-card.component';

@Component({
  selector: 'app-product-catalog',
  // Browser-dependent output (WebGL, device tier, query params) — rendered on the client, not hydrated.
  host: { ngSkipHydration: 'true' },
  imports: [RouterLink, ProductCardComponent, RevealDirective],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './product-catalog.component.html',
  styleUrl: './product-catalog.component.scss',
})
export class ProductCatalogComponent {
  /** null = all categories */
  readonly category = input<ProductCategoryId | null>(null);

  readonly categories = CATEGORIES;
  readonly total = PRODUCTS.length;
  readonly activeCategory = computed(
    () => CATEGORIES.find((c) => c.id === this.category()) ?? null,
  );
  readonly products = computed(() => {
    const c = this.category();
    return c ? PRODUCTS.filter((p) => p.category === c) : PRODUCTS;
  });
  readonly counts = computed(() =>
    Object.fromEntries(
      CATEGORIES.map((c) => [c.id, PRODUCTS.filter((p) => p.category === c.id).length]),
    ),
  );
  /** Show the "jacket made to measure" card when there are no jacket models yet */
  readonly showJacketRequest = computed(
    () => (this.category() === null || this.category() === 'jakne') && this.counts()['jakne'] === 0,
  );
}
