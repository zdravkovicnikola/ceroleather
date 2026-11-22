import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  input,
  linkedSignal,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { MeasurementGuideComponent } from '../../components/measurement-guide/measurement-guide.component';
import { OrderFormComponent } from '../../components/order-form/order-form.component';
import { ProductCardComponent } from '../../components/product-card/product-card.component';
import { ProductGalleryComponent } from '../../components/product-gallery/product-gallery.component';
import { ProductViewer360Component } from '../../components/product-viewer-360/product-viewer-360.component';
import { SITE_CONFIG } from '../../core/config/site.config';
import { SeoService, breadcrumbLd } from '../../core/seo/seo.service';
import { OrderStateService } from '../../core/services/order-state.service';
import { ScrollService } from '../../core/services/scroll.service';
import { categoryLabel } from '../../data/categories.data';
import { PRODUCTS, findProduct } from '../../data/products.data';
import { RevealDirective } from '../../shared/directives/reveal.directive';
import { ProductCategoryId } from '../../models/product.model';

/** Singular product type for titles ("Buckle — kožni prsluk po meri") */
const SINGULAR: Record<ProductCategoryId, string> = {
  muski: 'kožni prsluk',
  zenski: 'ženski model',
  custom: 'custom model',
};

@Component({
  selector: 'app-product-detail-page',
  imports: [
    RouterLink,
    ProductGalleryComponent,
    ProductViewer360Component,
    MeasurementGuideComponent,
    OrderFormComponent,
    ProductCardComponent,
    RevealDirective,
  ],
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
  /** 360° viewer first when the product has a frame sequence; resets when the product changes */
  readonly mediaView = linkedSignal<'360' | 'photos'>(() =>
    this.product()?.spin360 ? '360' : 'photos',
  );

  constructor() {
    const seo = inject(SeoService);
    effect(() => {
      const p = this.product();
      if (!p) {
        seo.update({
          title: 'Model nije pronađen — CeroLeather',
          description:
            'Ovaj model ne postoji ili je uklonjen iz kataloga. Pogledajte druge CeroLeather modele.',
          noindex: true,
        });
        return;
      }
      this.state.selectedProductSlug.set(p.slug);
      const cat = categoryLabel(p.category);
      const kind = SINGULAR[p.category];
      const path = `/katalog/${p.slug}`;
      seo.update({
        title: `${p.name} — ${kind} po meri | CeroLeather`,
        description:
          `${p.shortDescription} Ručna izrada po vašim merama — pošaljite zahtev za porudžbinu.`.slice(
            0,
            300,
          ),
        path,
        type: 'product',
        image: p.images[0].src,
        imageAlt: p.images[0].alt,
        jsonLd: [
          {
            // Only facts from products.data.ts — no invented prices, ratings or reviews.
            '@context': 'https://schema.org',
            '@type': 'Product',
            name: `${p.name} — ${kind}`,
            description: [p.shortDescription, ...p.description].join(' '),
            image: p.images.map((img) => seo.absolute(img.src)),
            url: seo.absolute(path),
            category: cat,
            brand: { '@type': 'Brand', name: 'CeroLeather' },
            ...(p.features.length
              ? {
                  additionalProperty: p.features.map((f) => ({
                    '@type': 'PropertyValue',
                    name: 'Detalj',
                    value: f,
                  })),
                }
              : {}),
          },
          breadcrumbLd(seo, [
            { name: 'Početna', path: '/' },
            { name: 'Katalog', path: '/katalog' },
            { name: p.name, path },
          ]),
        ],
      });
    });
  }

  toForm(): void {
    this.scroll.scrollTo('#porudzbina-forma', -100);
  }

  toGuide(): void {
    this.scroll.scrollTo('#vodic', -100);
  }
}
