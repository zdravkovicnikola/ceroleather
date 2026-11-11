import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { ProductCatalogComponent } from '../../components/product-catalog/product-catalog.component';
import { CATEGORIES } from '../../data/categories.data';
import { ProductCategoryId } from '../../models/product.model';
import { RevealDirective } from '../../shared/directives/reveal.directive';

@Component({
  selector: 'app-catalog-page',
  imports: [ProductCatalogComponent, RevealDirective],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="page-hero container">
      <p class="eyebrow" appReveal="fade">Katalog</p>
      <h1 class="display display--xl" appReveal="lines">
        <span class="line"><span>Kolekcija</span></span>
        <span class="line"><span class="text-red">po meri</span></span>
      </h1>
      <p class="lead" appReveal="up">
        Svaki model je polazna tačka. Izaberite kroj, a mi ga izrađujemo po vašim merama i prilagođavamo vašim željama.
      </p>
    </section>
    <section class="container catalog-wrap">
      <app-product-catalog [category]="category()" />
    </section>
  `,
  styles: `
    .page-hero {
      padding-top: calc(var(--header-h) + clamp(60px, 10vw, 140px));
      padding-bottom: clamp(48px, 6vw, 90px);
    }
    .page-hero .lead {
      margin-top: 32px;
    }
    .catalog-wrap {
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
