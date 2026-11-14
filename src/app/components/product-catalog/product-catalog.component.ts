import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
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
import { PLATFORM_ID } from '@angular/core';
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

  // ── horizontal carousel (native scroll + scroll-snap; arrows only move the track) ─────────
  private readonly track = viewChild<ElementRef<HTMLElement>>('track');
  /** number of cards in the track (products + optional jacket card) */
  readonly itemCount = computed(() => this.products().length + (this.showJacketRequest() ? 1 : 0));
  /** index of the first (at least half) visible card */
  readonly first = signal(0);
  /** how many cards fit side by side at the current width */
  readonly perView = signal(1);
  readonly canPrev = signal(false);
  readonly canNext = signal(false);
  /** 0–1 scroll position, drives the progress line */
  readonly progress = signal(0);
  readonly lastVisible = computed(() => Math.min(this.itemCount(), this.first() + this.perView()));
  readonly scrollable = computed(() => this.canPrev() || this.canNext());

  private frame = 0;

  constructor() {
    const destroyRef = inject(DestroyRef);
    const isBrowser = isPlatformBrowser(inject(PLATFORM_ID));

    // New category → start at the first card again (browser only; the page is also prerendered)
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

  /** Arrow buttons: move by one "page" of visible cards. */
  step(dir: 1 | -1): void {
    const target = Math.max(0, Math.min(this.itemCount() - 1, this.first() + dir * this.perView()));
    this.scrollToIndex(target);
  }

  /** ←/→ on the focused track: one card at a time. */
  onKey(e: KeyboardEvent): void {
    if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
    if ((e.target as HTMLElement) !== e.currentTarget) return; // let links handle their own keys
    e.preventDefault();
    this.scrollToIndex(this.first() + (e.key === 'ArrowRight' ? 1 : -1));
  }

  private items(): HTMLElement[] {
    const el = this.track()?.nativeElement;
    return el ? (Array.from(el.children) as HTMLElement[]) : [];
  }

  private scrollToIndex(index: number): void {
    const el = this.track()?.nativeElement;
    const items = this.items();
    if (!el || !items.length) return;
    const i = Math.max(0, Math.min(items.length - 1, index));
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    el.scrollTo({
      left: items[i].offsetLeft - items[0].offsetLeft,
      behavior: reduce ? 'auto' : 'smooth',
    });
  }

  private measure(): void {
    const el = this.track()?.nativeElement;
    const items = this.items();
    if (!el || !items.length) return;
    const step =
      items.length > 1 ? items[1].offsetLeft - items[0].offsetLeft : items[0].offsetWidth;
    const max = el.scrollWidth - el.clientWidth;
    this.perView.set(Math.max(1, Math.round(el.clientWidth / step)));
    this.first.set(Math.min(items.length - 1, Math.round(el.scrollLeft / step)));
    this.canPrev.set(el.scrollLeft > 4);
    this.canNext.set(el.scrollLeft < max - 4);
    this.progress.set(max > 0 ? el.scrollLeft / max : 1);
  }
}
