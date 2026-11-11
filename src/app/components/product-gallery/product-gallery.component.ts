import { ChangeDetectionStrategy, Component, computed, effect, input, signal } from '@angular/core';
import { Product, ProductImageKind } from '../../models/product.model';

const KIND_LABEL: Record<ProductImageKind, string> = {
  front: 'Prednja strana',
  back: 'Zadnja strana',
  side: 'Bočno',
  open: 'Otvoren / postava',
  detail: 'Detalj',
};

@Component({
  selector: 'app-product-gallery',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @let imgs = product().images;
    <div class="pg" (keydown.arrowRight)="step(1)" (keydown.arrowLeft)="step(-1)">
      <div
        class="pg__stage"
        [style.--pg-backdrop]="'url(' + imgs[active()].srcSm + ')'"
        role="group"
        aria-roledescription="galerija"
        [attr.aria-label]="'Fotografije: ' + product().name"
      >
        @for (img of imgs; track img.src; let i = $index) {
          <img
            class="pg__img"
            [class.is-active]="i === active()"
            [src]="img.src"
            [srcset]="img.srcSm + ' 760w, ' + img.src + ' 1600w'"
            sizes="(max-width: 1000px) 94vw, 50vw"
            [alt]="img.alt"
            [attr.aria-hidden]="i !== active()"
            [attr.loading]="i === 0 ? 'eager' : 'lazy'"
            [attr.fetchpriority]="i === 0 ? 'high' : null"
          />
        }
        <div class="pg__meta">
          <span class="pg__kind">{{ label() }}</span>
          <span class="pg__count">{{ active() + 1 }} / {{ imgs.length }}</span>
        </div>
        @if (imgs.length > 1) {
          <button
            type="button"
            class="pg__arrow pg__arrow--prev"
            (click)="step(-1)"
            aria-label="Prethodna fotografija"
          >
            <span></span>
          </button>
          <button
            type="button"
            class="pg__arrow pg__arrow--next"
            (click)="step(1)"
            aria-label="Sledeća fotografija"
          >
            <span></span>
          </button>
        }
      </div>

      @if (imgs.length > 1) {
        <div class="pg__thumbs" role="tablist" aria-label="Izbor fotografije">
          @for (img of imgs; track img.src; let i = $index) {
            <button
              type="button"
              role="tab"
              class="pg__thumb"
              [class.is-active]="i === active()"
              [attr.aria-selected]="i === active()"
              [attr.aria-label]="img.caption ?? kindLabel(img.kind)"
              (click)="active.set(i)"
            >
              <img [src]="img.srcSm" alt="" loading="lazy" />
            </button>
          }
        </div>
      }
    </div>
  `,
  styleUrl: './product-gallery.component.scss',
})
export class ProductGalleryComponent {
  readonly product = input.required<Product>();
  readonly active = signal(0);

  readonly label = computed(() => {
    const img = this.product().images[this.active()];
    return img ? (img.caption ?? KIND_LABEL[img.kind]) : '';
  });

  constructor() {
    effect(() => {
      this.product();
      this.active.set(0);
    });
  }

  kindLabel(k: ProductImageKind): string {
    return KIND_LABEL[k];
  }

  step(d: number): void {
    const n = this.product().images.length;
    this.active.update((i) => (i + d + n) % n);
  }
}
