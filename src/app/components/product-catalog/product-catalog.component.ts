import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  PLATFORM_ID,
  afterNextRender,
  computed,
  effect,
  inject,
  input,
  signal,
  untracked,
  viewChild,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { RouterLink } from '@angular/router';
import { SITE_CONFIG } from '../../core/config/site.config';
import { CATEGORIES } from '../../data/categories.data';
import { PRODUCTS } from '../../data/products.data';
import { Product, ProductCategoryId, formatPrice } from '../../models/product.model';
import { RevealDirective } from '../../shared/directives/reveal.directive';

/**
 * Catalog showcase: filters + a horizontal slider of the models, laid directly on the leather
 * background (see catalog.page.ts). Only image, name and price per model — the rest is on the
 * product page. The slider is a natively scrollable track with scroll-snap (touch swipe,
 * trackpad, Shift+wheel, ←/→ when focused); the arrows only scroll the track. No autoplay.
 */
@Component({
  selector: 'app-product-catalog',
  // Category comes from the query string (browser) — rendered on the client, not hydrated.
  host: { ngSkipHydration: 'true' },
  imports: [RouterLink, RevealDirective],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './product-catalog.component.html',
  styleUrl: './product-catalog.component.scss',
})
export class ProductCatalogComponent {
  /** null = all categories */
  readonly category = input<ProductCategoryId | null>(null);

  readonly categories = CATEGORIES;
  readonly total = PRODUCTS.length;
  readonly showPrices = SITE_CONFIG.showPrices;
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

  price(p: Product): string {
    return p.price ? formatPrice(p.price, SITE_CONFIG.currency) : '';
  }

  // ── slider ────────────────────────────────────────────────────────────────────────────────
  private readonly track = viewChild<ElementRef<HTMLElement>>('track');
  readonly canPrev = signal(false);
  readonly canNext = signal(false);
  readonly scrollable = computed(() => this.canPrev() || this.canNext());
  private frame = 0;

  constructor() {
    const destroyRef = inject(DestroyRef);
    const isBrowser = isPlatformBrowser(inject(PLATFORM_ID));

    // New category → back to the first model, then re-measure (after the new items rendered)
    effect(() => {
      this.products();
      if (!isBrowser) return;
      untracked(() => {
        const el = this.track()?.nativeElement;
        if (el) el.scrollLeft = 0;
        requestAnimationFrame(() => this.measure());
      });
    });

    afterNextRender(() => {
      const el = this.track()?.nativeElement;
      if (!el) return;
      const onScroll = () => {
        cancelAnimationFrame(this.frame);
        this.frame = requestAnimationFrame(() => this.measure());
      };
      el.addEventListener('scroll', onScroll, { passive: true });
      const ro = new ResizeObserver(() => this.measure());
      ro.observe(el);
      this.measure();
      destroyRef.onDestroy(() => {
        el.removeEventListener('scroll', onScroll);
        ro.disconnect();
        cancelAnimationFrame(this.frame);
      });
    });
  }

  /** Arrows: move by one "page" of fully visible models (4 on desktop). */
  step(dir: 1 | -1): void {
    const items = this.items();
    if (!items.length) return;
    const first = this.firstIndex();
    this.scrollToIndex(first + dir * this.perView());
  }

  /** ←/→ on the focused track: one model at a time. */
  onKey(e: KeyboardEvent): void {
    if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
    if ((e.target as HTMLElement) !== e.currentTarget) return; // let links handle their own keys
    e.preventDefault();
    this.scrollToIndex(this.firstIndex() + (e.key === 'ArrowRight' ? 1 : -1));
  }

  private items(): HTMLElement[] {
    const el = this.track()?.nativeElement;
    return el ? (Array.from(el.children) as HTMLElement[]) : [];
  }

  private stepWidth(): number {
    const items = this.items();
    return items.length > 1 ? items[1].offsetLeft - items[0].offsetLeft : (items[0]?.offsetWidth ?? 1);
  }

  private firstIndex(): number {
    const el = this.track()?.nativeElement;
    return el ? Math.round(el.scrollLeft / this.stepWidth()) : 0;
  }

  /** fully visible models: n items + (n−1) gaps fill the track, so add one gap before dividing */
  private perView(): number {
    const el = this.track()?.nativeElement;
    const items = this.items();
    if (!el || !items.length) return 1;
    const step = this.stepWidth();
    const gap = Math.max(0, step - items[0].offsetWidth);
    return Math.max(1, Math.floor((el.clientWidth + gap + 2) / step));
  }

  private scrollToIndex(index: number): void {
    const el = this.track()?.nativeElement;
    const items = this.items();
    if (!el || !items.length) return;
    const i = Math.max(0, Math.min(items.length - 1, index));
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    el.scrollTo({ left: items[i].offsetLeft - items[0].offsetLeft, behavior: reduce ? 'auto' : 'smooth' });
  }

  private measure(): void {
    const el = this.track()?.nativeElement;
    if (!el) return;
    const max = el.scrollWidth - el.clientWidth;
    this.canPrev.set(el.scrollLeft > 4);
    this.canNext.set(el.scrollLeft < max - 4);
  }
}
