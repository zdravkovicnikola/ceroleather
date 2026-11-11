import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  afterNextRender,
  inject,
  output,
  signal,
  viewChild,
} from '@angular/core';
import { DeviceCapabilityService } from '../../core/services/device-capability.service';
import type { HeroScene } from '../../three/hero-scene';

/**
 * Hosts the Three.js product scene. Three.js is loaded lazily (separate chunk),
 * rendering pauses when off-screen, and all GPU resources are disposed on destroy.
 * Emits `ready` with the scene so a parent can drive it (e.g. GSAP ScrollTrigger),
 * or `failed` so the parent can show a photographic fallback.
 */
@Component({
  selector: 'app-product-viewer-3d',
  // Browser-dependent output (WebGL, device tier, query params) — rendered on the client, not hydrated.
  host: { ngSkipHydration: 'true' },
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <canvas
      #canvas
      class="viewer__canvas"
      [class.is-ready]="state() === 'ready'"
      aria-hidden="true"
    ></canvas>
    @if (state() === 'loading') {
      <div class="viewer__loader" role="status">
        <span class="viewer__loader-bar"></span>
        <span class="viewer__loader-text">Učitavanje 3D modela</span>
      </div>
    }
  `,
  styles: `
    :host {
      position: absolute;
      inset: 0;
      display: block;
    }
    .viewer__canvas {
      width: 100%;
      height: 100%;
      display: block;
      opacity: 0;
      transition: opacity 1.6s var(--ease);
    }
    .viewer__canvas.is-ready {
      opacity: 1;
    }
    .viewer__loader {
      position: absolute;
      left: 50%;
      top: 50%;
      transform: translate(-50%, -50%);
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 14px;
    }
    .viewer__loader-bar {
      width: 120px;
      height: 1px;
      background: var(--line-strong);
      position: relative;
      overflow: hidden;
    }
    .viewer__loader-bar::after {
      content: '';
      position: absolute;
      inset: 0;
      background: var(--red);
      animation: load 1.4s var(--ease-in-out) infinite;
    }
    .viewer__loader-text {
      font-family: var(--font-mono);
      font-size: 0.62rem;
      letter-spacing: 0.3em;
      text-transform: uppercase;
      color: var(--text-3);
    }
    @keyframes load {
      from {
        transform: translateX(-100%);
      }
      to {
        transform: translateX(100%);
      }
    }
  `,
})
export class ProductViewer3dComponent {
  readonly ready = output<HeroScene>();
  readonly failed = output<void>();
  readonly state = signal<'loading' | 'ready' | 'failed'>('loading');

  private readonly canvas = viewChild.required<ElementRef<HTMLCanvasElement>>('canvas');
  private readonly device = inject(DeviceCapabilityService);
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
  private scene?: HeroScene;
  private observer?: IntersectionObserver;
  private destroyed = false;

  constructor() {
    afterNextRender(() => void this.init());
    inject(DestroyRef).onDestroy(() => {
      this.destroyed = true;
      this.observer?.disconnect();
      this.scene?.dispose();
    });
  }

  private async init(): Promise<void> {
    if (this.device.quality === 'none') return this.fail();
    try {
      const { HeroScene } = await import('../../three/hero-scene');
      if (this.destroyed) return;
      const scene = new HeroScene(this.canvas().nativeElement, {
        quality: this.device.quality === 'high' ? 'high' : 'low',
        pixelRatio: this.device.pixelRatio,
        reducedMotion: this.device.reducedMotion(),
      });
      await scene.init();
      if (this.destroyed) return scene.dispose();
      this.scene = scene;
      this.state.set('ready');
      this.observer = new IntersectionObserver(([entry]) =>
        entry.isIntersecting ? scene.start() : scene.stop(),
      );
      this.observer.observe(this.host);
      this.ready.emit(scene);
    } catch (err) {
      console.error('[CeroLeather] 3D viewer failed', err);
      this.fail();
    }
  }

  private fail(): void {
    this.state.set('failed');
    this.failed.emit();
  }
}
