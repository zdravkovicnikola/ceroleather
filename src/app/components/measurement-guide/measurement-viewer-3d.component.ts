import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  afterNextRender,
  effect,
  inject,
  input,
  signal,
  viewChild,
} from '@angular/core';
import { DeviceCapabilityService } from '../../core/services/device-capability.service';
import { MeasurementDefinition } from '../../models/measurement.model';
import type { LabelPosition, MannequinScene } from '../../three/mannequin-scene';
import { MeasurementFigureSvgComponent } from './measurement-figure-svg.component';

/**
 * 3D mannequin with measuring-tape indicators.
 * - Three.js is only downloaded/initialised when the viewer scrolls into view.
 * - Falls back to the animated SVG figure if WebGL is unavailable or loading fails.
 */
@Component({
  selector: 'app-measurement-viewer-3d',
  // Browser-dependent output (WebGL, device tier, query params) — rendered on the client, not hydrated.
  host: { ngSkipHydration: 'true' },
  imports: [MeasurementFigureSvgComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="mv" [class.mv--3d]="mode() === '3d'">
      @if (activeDef(); as d) {
        @if (!d.guide3d) {
          <div class="mv__note" aria-hidden="true">
            <span class="mv__note-label">{{ d.label }}{{ d.required ? '' : ' · opciono' }}</span>
            <span class="mv__note-value">{{ valueText() }}</span>
            <span class="mv__note-text">Ne meri se na lutki — unesite okvirnu vrednost.</span>
          </div>
        }
      }
      @if (mode() === 'svg') {
        <app-measurement-figure-svg
          class="mv__svg"
          [definitions]="definitions()"
          [activeId]="activeId()"
        />
      } @else {
        <canvas #canvas class="mv__canvas" [class.is-ready]="ready()" aria-hidden="true"></canvas>
        @if (!ready()) {
          <div class="mv__loading" role="status">Učitavanje 3D prikaza…</div>
        }
        <div
          #label
          class="mv__label"
          [class.is-visible]="labelVisible() && !!activeDef()?.guide3d"
          aria-hidden="true"
        >
          <span class="mv__label-name">{{ activeDef()?.label }}</span>
          <span class="mv__label-value">{{ valueText() }}</span>
        </div>
        @if (ready()) {
          <p class="mv__hint" aria-hidden="true">
            <span class="mv__hint-icon"></span> Prevucite da okrenete
          </p>
        }
      }
    </div>
  `,
  styleUrl: './measurement-viewer-3d.component.scss',
})
export class MeasurementViewer3dComponent {
  readonly definitions = input.required<MeasurementDefinition[]>();
  readonly activeId = input<string | null>(null);
  readonly activeValue = input<number | null>(null);

  readonly mode = signal<'3d' | 'svg'>('3d');
  readonly ready = signal(false);
  readonly labelVisible = signal(false);

  private readonly canvas = viewChild<ElementRef<HTMLCanvasElement>>('canvas');
  private readonly label = viewChild<ElementRef<HTMLElement>>('label');
  private readonly device = inject(DeviceCapabilityService);
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
  private scene?: MannequinScene;
  private observer?: IntersectionObserver;
  private destroyed = false;

  activeDef() {
    return this.definitions().find((d) => d.id === this.activeId()) ?? null;
  }

  valueText(): string {
    const v = this.activeValue();
    return v == null ? '— cm' : `${v} cm`;
  }

  constructor() {
    if (this.device.quality === 'none') this.mode.set('svg');

    afterNextRender(() => {
      if (this.mode() !== '3d') return;
      // Lazy: initialise only once the viewer is near the viewport.
      this.observer = new IntersectionObserver(
        ([entry]) => {
          if (!entry.isIntersecting) return this.scene?.stop();
          if (!this.scene) void this.init();
          else this.scene.start();
        },
        { rootMargin: '200px' },
      );
      this.observer.observe(this.host);
    });

    effect(() => {
      const id = this.activeId();
      if (id && this.ready()) this.scene?.setActive(id);
    });

    inject(DestroyRef).onDestroy(() => {
      this.destroyed = true;
      this.observer?.disconnect();
      this.scene?.dispose();
    });
  }

  private initializing = false;

  private async init(): Promise<void> {
    const canvas = this.canvas()?.nativeElement;
    if (!canvas || this.initializing) return;
    this.initializing = true;
    try {
      const { MannequinScene } = await import('../../three/mannequin-scene');
      if (this.destroyed) return;
      const scene = new MannequinScene(canvas, {
        quality: this.device.quality === 'high' ? 'high' : 'low',
        pixelRatio: this.device.pixelRatio,
        reducedMotion: this.device.reducedMotion(),
      });
      scene.onLabel = (p) => this.placeLabel(p);
      await scene.init(this.definitions());
      if (this.destroyed) return scene.dispose();
      this.scene = scene;
      this.ready.set(true);
      const id = this.activeId();
      if (id) scene.setActive(id);
      scene.start();
    } catch (err) {
      console.error('[CeroLeather] Measurement 3D viewer failed, using SVG fallback', err);
      this.mode.set('svg');
    }
  }

  private placeLabel(p: LabelPosition): void {
    const el = this.label()?.nativeElement;
    if (!el) return;
    el.style.transform = `translate3d(${p.x}px, ${p.y}px, 0)`;
    if (p.visible !== this.labelVisible()) this.labelVisible.set(p.visible);
  }
}
