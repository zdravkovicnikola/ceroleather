import { ChangeDetectionStrategy, Component, computed, effect, inject, input } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { RouterLink } from '@angular/router';
import { MeasurementGuideComponent } from '../../components/measurement-guide/measurement-guide.component';
import { OrderFormComponent } from '../../components/order-form/order-form.component';
import { ProductCardComponent } from '../../components/product-card/product-card.component';
import { ProductGalleryComponent } from '../../components/product-gallery/product-gallery.component';
import { SITE_CONFIG } from '../../core/config/site.config';
import { OrderStateService } from '../../core/services/order-state.service';
import { ScrollService } from '../../core/services/scroll.service';
import { categoryLabel } from '../../data/categories.data';
import { PRODUCTS, findProduct } from '../../data/products.data';
import { RevealDirective } from '../../shared/directives/reveal.directive';

@Component({
  selector: 'app-product-detail-page',
  imports: [RouterLink, ProductGalleryComponent, MeasurementGuideComponent, OrderFormComponent, ProductCardComponent, RevealDirective],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './product-detail.page.html',
  styleUrl: './product-detail.page.scss',
})
export class ProductDetailPage {
  /** Route param :slug */
  readonly slug = input.required<string>();

  private readonly scroll = inject(ScrollService);
  private readonly state = inject(OrderStateService);

  readonly product = computed(() => findProduct(this.slug()));
  readonly category = computed(() => {
    const p = this.product();
    return p ? categoryLabel(p.category) : '';
  });
  readonly others = computed(() => PRODUCTS.filter((p) => p.slug !== this.slug()).slice(0, 3));
  readonly showPrices = SITE_CONFIG.showPrices;

  constructor() {
    const title = inject(Title);
    effect(() => {
      const p = this.product();
      title.setTitle(p ? `${p.name} — ${categoryLabel(p.category)} — CeroLeather` : 'Model nije pronađen — CeroLeather');
      if (p) this.state.selectedProductSlug.set(p.slug);
    });
  }

  toForm(): void {
    this.scroll.scrollTo('#porudzbina-forma', -100);
  }

  toGuide(): void {
    this.scroll.scrollTo('#vodic', -100);
  }
}
