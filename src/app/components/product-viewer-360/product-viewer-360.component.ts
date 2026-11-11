import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  afterNextRender,
  computed,
  inject,
  input,
  signal,
  viewChild,
} from '@angular/core';
import { DeviceCapabilityService } from '../../core/services/device-capability.service';
import { ProductSpin360 } from '../../models/product.model';

/**
 * Interactive 360° product viewer — a FRAME SEQUENCE (images taken at evenly spaced
 * angles around the product), NOT a 3D model.
 *
 * - Mouse / touch / pen dragging in both directions (Pointer Events), keyboard arrows, buttons.
 * - Fractional positions cross-fade the two neighbouring frames → smooth rotation, plus inertia.
 * - Frames are only downloaded when the viewer approaches the viewport; small frames on phones.
 * - Loading progress, poster frame while loading, fallback photo if the frames fail.
 * - Vertical page scrolling on touch devices keeps working (`touch-action: pan-y`).
 */
@Component({
  selector: 'app-product-viewer-360',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { ngSkipHydration: 'true' },
  template: `
    @let s = spin();
    <div
      class="v360"
      [class.is-ready]="ready()"
      [class.is-dragging]="dragging()"
      [class.is-failed]="failed()"
    >
      <div
        #stage
        class="v360__stage"
        [attr.tabindex]="failed() ? null : 0"
        [attr.role]="failed() ? null : 'slider'"
        [attr.aria-label]="failed() ? null : s.alt"
        [attr.aria-valuemin]="failed() ? null : 0"
        [attr.aria-valuemax]="failed() ? null : 359"
        [attr.aria-valuenow]="failed() ? null : degrees()"
        [attr.aria-valuetext]="failed() ? null : degrees() + '°'"
        (pointerdown)="onDown($event)"
        (keydown)="onKey($event)"
      >
        <!-- poster: first frame while loading, the product photo if frames fail -->
        <img
          class="v360__poster"
          [src]="failed() ? fallbackSrc() : s.path + '/00-sm.webp'"
          [alt]="failed() ? fallbackAlt() : ''"
          [attr.aria-hidden]="failed() ? null : 'true'"
          draggable="false"
        />
        <canvas #canvas class="v360__canvas" aria-hidden="true"></canvas>

        @if (!ready() && !failed()) {
          <div class="v360__loading" role="status">
            <span class="v360__loading-label">Učitavanje 360° prikaza</span>
            <span class="v360__bar"
              ><span [style.transform]="'scaleX(' + progress() + ')'"></span
            ></span>
            <span class="v360__pct">{{ percent() }}%</span>
          </div>
        }
        @if (failed()) {
          <p class="v360__error" role="status">
            360° prikaz trenutno nije dostupan — prikazana je fotografija.
          </p>
        }

        @if (ready()) {
          <div class="v360__hint" [class.is-hidden]="interacted()" aria-hidden="true">
            <span class="v360__hint-icon"></span> Prevucite levo ili desno
          </div>
        }
        <span class="v360__badge" aria-hidden="true">360°</span>
      </div>

      @if (!failed()) {
        <div class="v360__controls">
          <button
            type="button"
            class="v360__btn"
            (click)="nudge(-1)"
            [disabled]="!ready()"
            aria-label="Okreni ulevo"
          >
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 6l-6 6 6 6" /></svg>
          </button>
          <div class="v360__dial" aria-hidden="true">
            <svg viewBox="0 0 40 40">
              <circle class="v360__dial-track" cx="20" cy="20" r="17" />
              <circle
                class="v360__dial-dot"
                [attr.cx]="20 + 17 * sin(degrees())"
                [attr.cy]="20 - 17 * cos(degrees())"
                r="3"
              />
            </svg>
            <span class="v360__deg">{{ degrees() }}°</span>
          </div>
          <button
            type="button"
            class="v360__btn"
            (click)="nudge(1)"
            [disabled]="!ready()"
            aria-label="Okreni udesno"
          >
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 6l6 6-6 6" /></svg>
          </button>
        </div>
      }
    </div>
  `,
  styleUrl: './product-viewer-360.component.scss',
})
export class ProductViewer360Component {
  readonly spin = input.required<ProductSpin360>();
  /** Shown if the frame sequence cannot be loaded */
  readonly fallbackSrc = input.required<string>();
  readonly fallbackAlt = input('');

  readonly ready = signal(false);
  readonly failed = signal(false);
  readonly dragging = signal(false);
  readonly interacted = signal(false);
  readonly progress = signal(0);
  readonly percent = computed(() => Math.round(this.progress() * 100));
  /** Current position in frames (fractional, unbounded — wraps when drawn) */
  private readonly position = signal(0);
  readonly degrees = computed(() => {
    const n = this.spin().frames;
    const wrapped = ((this.position() % n) + n) % n;
    return Math.round(wrapped * (360 / n)) % 360;
  });

  private readonly stage = viewChild.required<ElementRef<HTMLElement>>('stage');
  private readonly canvas = viewChild.required<ElementRef<HTMLCanvasElement>>('canvas');
  private readonly device = inject(DeviceCapabilityService);
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;

  private frames: HTMLImageElement[] = [];
  private ctx: CanvasRenderingContext2D | null = null;
  private velocity = 0;
  private raf = 0;
  private lastX = 0;
  private lastT = 0;
  private destroyed = false;
  private readonly cleanup: Array<() => void> = [];

  constructor() {
    afterNextRender(() => {
      const io = new IntersectionObserver(
        ([e]) => {
          if (!e.isIntersecting) return;
          io.disconnect();
          void this.load();
        },
        { rootMargin: '300px' },
      );
      io.observe(this.host);
      this.cleanup.push(() => io.disconnect());

      const ro = new ResizeObserver(() => this.resize());
      ro.observe(this.stage().nativeElement);
      this.cleanup.push(() => ro.disconnect());
    });

    inject(DestroyRef).onDestroy(() => {
      this.destroyed = true;
      // also runs during server prerendering, where there is no animation-frame API
      if (typeof cancelAnimationFrame === 'function') cancelAnimationFrame(this.raf);
      this.cleanup.forEach((fn) => fn());
      // let the browser release the decoded bitmaps
      this.frames.forEach((img) => img.removeAttribute('src'));
      this.frames = [];
    });
  }

  sin(deg: number): number {
    return Math.sin((deg * Math.PI) / 180);
  }
  cos(deg: number): number {
    return Math.cos((deg * Math.PI) / 180);
  }

  // ---------------------------------------------------------------------------
  // Loading

  private async load(): Promise<void> {
    const s = this.spin();
    const cssWidth = this.stage().nativeElement.clientWidth || 600;
    // Small frames on phones / small stages (≈4× less decoded memory: 72 × 420² px),
    // large ones on tablets and desktops.
    const suffix = cssWidth <= 520 ? '-sm' : '';
    let done = 0;
    let errors = 0;

    // Interleaved order (0, 36, 18, 54, …) so a coarse full turn is available early.
    const queue = interleave(s.frames);
    this.frames = new Array(s.frames);
    const worker = async () => {
      while (queue.length && !this.destroyed) {
        const i = queue.shift()!;
        const img = new Image();
        img.decoding = 'async';
        img.src = `${s.path}/${String(i).padStart(2, '0')}${suffix}.webp`;
        try {
          await img.decode();
          this.frames[i] = img;
        } catch {
          errors++;
        }
        done++;
        this.progress.set(done / s.frames);
      }
    };
    // 6 parallel requests: fast on HTTP/2, gentle on slow mobile connections
    await Promise.all(Array.from({ length: 6 }, worker));
    if (this.destroyed) return;

    if (errors > s.frames * 0.25 || !this.frames[0]) {
      this.failed.set(true);
      return;
    }
    this.fillGaps();
    this.ctx = this.canvas().nativeElement.getContext('2d');
    this.resize();
    this.ready.set(true);
    if (!this.device.reducedMotion()) this.introSpin();
  }

  /** A frame that failed to load borrows its nearest loaded neighbour. */
  private fillGaps(): void {
    const n = this.frames.length;
    for (let i = 0; i < n; i++) {
      if (this.frames[i]) continue;
      for (let d = 1; d < n; d++) {
        const f = this.frames[(i + d) % n] ?? this.frames[(i - d + n) % n];
        if (f) {
          this.frames[i] = f;
          break;
        }
      }
    }
  }

  // ---------------------------------------------------------------------------
  // Rendering

  private resize(): void {
    const c = this.canvas().nativeElement;
    const w = c.clientWidth;
    const h = c.clientHeight;
    if (!w || !h) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    c.width = Math.round(w * dpr);
    c.height = Math.round(h * dpr);
    this.draw();
  }

  private draw(): void {
    const ctx = this.ctx;
    if (!ctx || !this.frames.length) return;
    const n = this.frames.length;
    const pos = ((this.position() % n) + n) % n;
    const i0 = Math.floor(pos) % n;
    const i1 = (i0 + 1) % n;
    const t = pos - Math.floor(pos);
    const { width, height } = ctx.canvas;
    const size = Math.min(width, height);
    const x = (width - size) / 2;
    const y = (height - size) / 2;
    ctx.clearRect(0, 0, width, height);
    ctx.globalAlpha = 1;
    ctx.drawImage(this.frames[i0], x, y, size, size);
    if (t > 0.02) {
      // cross-fade towards the next frame → sub-frame smoothness
      ctx.globalAlpha = t;
      ctx.drawImage(this.frames[i1], x, y, size, size);
      ctx.globalAlpha = 1;
    }
  }

  private setPosition(p: number): void {
    this.position.set(p);
    this.draw();
  }

  // ---------------------------------------------------------------------------
  // Interaction

  /** Frames advanced per dragged pixel: one full turn ≈ 2 × the stage width */
  private get framesPerPx(): number {
    const w = this.stage().nativeElement.clientWidth || 600;
    return this.spin().frames / (w * 2);
  }

  onDown(e: PointerEvent): void {
    if (!this.ready() || (e.pointerType === 'mouse' && e.button !== 0)) return;
    const el = this.stage().nativeElement;
    el.setPointerCapture?.(e.pointerId);
    cancelAnimationFrame(this.raf);
    this.interacted.set(true);
    this.dragging.set(true);
    this.velocity = 0;
    this.lastX = e.clientX;
    this.lastT = performance.now();
    const dir = this.spin().direction ?? 1;

    const move = (ev: PointerEvent) => {
      const now = performance.now();
      const dx = ev.clientX - this.lastX;
      const dt = Math.max(1, now - this.lastT);
      // dragging right turns the front of the garment to the right
      const df = -dx * this.framesPerPx * dir;
      this.velocity = 0.8 * (df / dt) + 0.2 * this.velocity;
      this.lastX = ev.clientX;
      this.lastT = now;
      this.setPosition(this.position() + df);
    };
    const up = () => {
      el.removeEventListener('pointermove', move);
      el.removeEventListener('pointerup', up);
      el.removeEventListener('pointercancel', up);
      this.dragging.set(false);
      if (performance.now() - this.lastT > 80) this.velocity = 0;
      this.coast();
    };
    el.addEventListener('pointermove', move);
    el.addEventListener('pointerup', up);
    el.addEventListener('pointercancel', up);
  }

  onKey(e: KeyboardEvent): void {
    if (e.key === 'ArrowLeft') this.nudge(-1);
    else if (e.key === 'ArrowRight') this.nudge(1);
    else return;
    e.preventDefault();
  }

  /** Button / keyboard step: 1/12 of a turn, animated */
  nudge(sign: 1 | -1): void {
    if (!this.ready()) return;
    this.interacted.set(true);
    const n = this.spin().frames;
    const dir = this.spin().direction ?? 1;
    this.animateTo(Math.round(this.position()) - sign * dir * (n / 12), 380);
  }

  /** Inertia after release */
  private coast(): void {
    if (this.device.reducedMotion() || Math.abs(this.velocity) < 0.002) return this.settle();
    let last = performance.now();
    const step = (now: number) => {
      const dt = now - last;
      last = now;
      this.velocity *= Math.pow(0.94, dt / 16.7);
      this.setPosition(this.position() + this.velocity * dt);
      if (Math.abs(this.velocity) > 0.002) this.raf = requestAnimationFrame(step);
      else this.settle();
    };
    this.raf = requestAnimationFrame(step);
  }

  /** Snap to the nearest real frame so the resting image is always crisp (never a blend). */
  private settle(): void {
    this.animateTo(Math.round(this.position()), 160);
  }

  private animateTo(target: number, ms: number): void {
    cancelAnimationFrame(this.raf);
    if (this.device.reducedMotion()) return this.setPosition(target);
    const from = this.position();
    const start = performance.now();
    const step = (now: number) => {
      const k = Math.min(1, (now - start) / ms);
      const eased = 1 - Math.pow(1 - k, 3);
      this.setPosition(from + (target - from) * eased);
      if (k < 1) this.raf = requestAnimationFrame(step);
    };
    this.raf = requestAnimationFrame(step);
  }

  /** One gentle out-and-back partial turn so visitors see the viewer is interactive */
  private introSpin(): void {
    const n = this.spin().frames;
    const start = performance.now();
    const ms = 1800;
    const step = (now: number) => {
      if (this.interacted()) return;
      const k = Math.min(1, (now - start) / ms);
      this.setPosition(Math.sin(k * Math.PI) * (n / 8));
      if (k < 1) this.raf = requestAnimationFrame(step);
      else this.setPosition(0);
    };
    this.raf = requestAnimationFrame(step);
  }
}

/** 0, n/2, n/4, 3n/4, … — every frame exactly once */
function interleave(n: number): number[] {
  const out: number[] = [];
  const seen = new Set<number>();
  for (let step = n; ; step = Math.max(1, Math.floor(step / 2))) {
    for (let i = 0; i < n; i += step) {
      if (!seen.has(i)) {
        seen.add(i);
        out.push(i);
      }
    }
    if (step === 1) break;
  }
  return out;
}
