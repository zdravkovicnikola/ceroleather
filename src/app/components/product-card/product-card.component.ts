import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { SITE_CONFIG } from '../../core/config/site.config';
import { categoryLabel } from '../../data/categories.data';
import { Product } from '../../models/product.model';

@Component({
  selector: 'app-product-card',
  imports: [RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @let p = product();
    <article
      class="card"
      [class.card--large]="size() === 'large'"
      [class.card--contain]="fit() === 'contain'"
    >
      <a
        class="card__media"
        [routerLink]="['/katalog', p.slug]"
        [attr.aria-label]="'Detalji modela ' + p.name"
        [style.--card-backdrop]="fit() === 'contain' ? 'url(' + p.images[0].srcSm + ')' : null"
      >
        <img
          class="card__img card__img--primary"
          [src]="p.images[0].srcSm"
          [srcset]="p.images[0].srcSm + ' 760w, ' + p.images[0].src + ' 1600w'"
          [sizes]="
            size() === 'large' ? '(max-width: 900px) 92vw, 58vw' : '(max-width: 900px) 92vw, 34vw'
          "
          [alt]="p.images[0].alt"
          loading="lazy"
        />
        @if (secondImage(); as img2) {
          <img
            class="card__img card__img--secondary"
            [src]="img2.srcSm"
            alt=""
            loading="lazy"
            aria-hidden="true"
          />
        }
        <span class="card__index">{{ indexLabel() }}</span>
        <span class="card__view">Pogledaj <span class="btn__arrow"></span></span>
      </a>

      <div class="card__body">
        <p class="card__category">{{ category() }}</p>
        <h3 class="card__name">
          <a [routerLink]="['/katalog', p.slug]">{{ p.name }}</a>
        </h3>
        @if (showPrice() && p.price) {
          <p class="card__price">
            {{ priceLabel() }}
          </p>
        }
        @if (p.shortDescription) {
          <p class="card__desc">{{ p.shortDescription }}</p>
        }
        <div class="card__actions">
          <a class="btn btn--sm" [routerLink]="['/katalog', p.slug]">Detalji</a>
          <a
            class="btn btn--sm btn--primary"
            routerLink="/porudzbina"
            [queryParams]="{ zahtev: 'katalog', proizvod: p.slug }"
            [attr.aria-label]="'Zatraži model ' + p.name"
            >Zatraži model</a
          >
        </div>
      </div>
    </article>
  `,
  styleUrl: './product-card.component.scss',
})
export class ProductCardComponent {
  readonly product = input.required<Product>();
  readonly index = input(0);
  readonly size = input<'normal' | 'large'>('normal');
  /**
   * 'contain' = uniform grid mode used by the catalog on tablet/desktop: every card gets the same
   * 4:5 frame and the whole garment stays visible (no cropping), over a soft blurred backdrop.
   * On phones (≤600px) the card keeps its original full-bleed `cover` look.
   */
  readonly fit = input<'cover' | 'contain'>('cover');

  readonly currency = SITE_CONFIG.currency;
  readonly showPrice = () => SITE_CONFIG.showPrices;
  readonly category = computed(() => categoryLabel(this.product().category));
  readonly secondImage = computed(() => this.product().images[1] ?? null);
  /** Full amounts with a (non-breaking) space as thousands separator: "7 500 RSD", "13 000–14 000 RSD" */
  readonly priceLabel = computed(() => {
    const pr = this.product().price;
    if (!pr) return '';
    const fmt = (n: number) => String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
    const amount = pr.amountMax ? `${fmt(pr.amount)}–${fmt(pr.amountMax)}` : fmt(pr.amount);
    return [pr.prefix, amount, pr.currency ?? this.currency].filter(Boolean).join(' ');
  });
  readonly indexLabel = computed(() => String(this.index() + 1).padStart(2, '0'));
}
