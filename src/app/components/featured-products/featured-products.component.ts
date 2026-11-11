import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { PRODUCTS } from '../../data/products.data';
import { RevealDirective } from '../../shared/directives/reveal.directive';
import { ProductCardComponent } from '../product-card/product-card.component';

@Component({
  selector: 'app-featured-products',
  imports: [RouterLink, ProductCardComponent, RevealDirective],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="featured section" aria-labelledby="featured-title">
      <div class="container">
        <header class="featured__head">
          <div>
            <p class="eyebrow" appReveal="fade">Kolekcija</p>
            <h2 id="featured-title" class="display display--lg" appReveal="lines">
              <span class="line"><span>Modeli iz</span></span>
              <span class="line"><span>radionice</span></span>
            </h2>
          </div>
          <a routerLink="/katalog" class="btn" appReveal="fade">Ceo katalog <span class="btn__arrow"></span></a>
        </header>

        <div class="featured__grid">
          @for (p of products; track p.slug; let i = $index) {
            <app-product-card
              class="featured__item"
              [class.featured__item--offset]="i % 2 === 1"
              [product]="p"
              [index]="i"
              [size]="i === 0 ? 'large' : 'normal'"
              appReveal="up"
            />
          }
        </div>
      </div>
    </section>
  `,
  styles: `
    .featured__head {
      display: flex;
      align-items: flex-end;
      justify-content: space-between;
      gap: 32px;
      flex-wrap: wrap;
      margin-bottom: clamp(56px, 7vw, 100px);
    }
    .featured__grid {
      display: grid;
      grid-template-columns: repeat(12, 1fr);
      gap: clamp(32px, 4vw, 64px) clamp(20px, 3vw, 40px);
    }
    .featured__item:nth-child(1) {
      grid-column: 1 / span 7;
      grid-row: span 2;
    }
    .featured__item:nth-child(2) {
      grid-column: 9 / span 4;
      margin-top: 12vw;
    }
    .featured__item:nth-child(3) {
      grid-column: 9 / span 4;
    }
    .featured__item:nth-child(4) {
      grid-column: 3 / span 5;
    }
    @media (max-width: 900px) {
      .featured__grid {
        grid-template-columns: 1fr 1fr;
      }
      .featured__item:nth-child(n) {
        grid-column: auto;
        grid-row: auto;
        margin-top: 0;
      }
      .featured__item:nth-child(1) {
        grid-column: 1 / -1;
      }
    }
    @media (max-width: 560px) {
      .featured__grid {
        grid-template-columns: 1fr;
      }
    }
  `,
})
export class FeaturedProductsComponent {
  readonly products = PRODUCTS.filter((p) => p.featured).slice(0, 4);
}
