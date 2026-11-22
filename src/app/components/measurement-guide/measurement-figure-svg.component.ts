import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { MeasurementDefinition } from '../../models/measurement.model';

/**
 * Animated SVG fallback for the measurement guide (no WebGL / low-end devices).
 * Coordinates come from each definition's `svg` field (viewBox 0 0 300 400).
 */
@Component({
  selector: 'app-measurement-figure-svg',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <svg
      viewBox="0 0 300 400"
      class="fig"
      role="img"
      [attr.aria-label]="'Prikaz mere: ' + (activeLabel() ?? '')"
    >
      <defs>
        <linearGradient id="torsoFill" x1="0" x2="1">
          <stop offset="0" stop-color="#8d8983" />
          <stop offset="0.45" stop-color="#cdc8c0" />
          <stop offset="1" stop-color="#7b7771" />
        </linearGradient>
      </defs>

      <!-- stand -->
      <rect x="146" y="336" width="8" height="46" fill="#9ea1a6" />
      <ellipse cx="150" cy="386" rx="52" ry="7" fill="#1c1c1c" />
      <!-- arms (behind the torso): shoulder → elbow → wrist, hanging slightly away from the body -->
      <path class="fig__arm" d="M66 104 L46 206 L38 300" />
      <path class="fig__arm" d="M234 104 L254 206 L262 300" />
      <!-- neck -->
      <path d="M131 62 L131 30 Q150 22 169 30 L169 62 Z" fill="url(#torsoFill)" />
      <ellipse cx="150" cy="28" rx="19" ry="5" fill="#b9bcc1" />
      <!-- torso -->
      <path
        class="fig__torso"
        d="M131 60 C130 72 120 78 98 84 C70 91 58 98 57 120 C55 150 61 176 71 200 C77 222 77 248 73 270 C69 300 70 320 74 338 L226 338 C230 320 231 300 227 270 C223 248 223 222 229 200 C239 176 245 150 243 120 C242 98 230 91 202 84 C180 78 170 72 169 60 Z"
        fill="url(#torsoFill)"
      />
      <path d="M150 62 L150 338" stroke="#9e978d" stroke-width="1" opacity="0.7" />

      @for (m of drawable(); track m.id) {
        @let active = m.id === activeId();
        @let svg = m.svg!;
        <g class="fig__m" [class.is-active]="active">
          @switch (svg.kind) {
            @case ('ring') {
              @if (svg.kind === 'ring') {
                <!-- back half (behind the body) -->
                <path
                  class="fig__back"
                  [attr.d]="arc(svg.cx, svg.cy, svg.rx, svg.ry, true)"
                  pathLength="100"
                />
                <!-- front half -->
                <path
                  class="fig__tape"
                  [attr.d]="arc(svg.cx, svg.cy, svg.rx, svg.ry, false)"
                  pathLength="100"
                />
                @if (active) {
                  <circle class="fig__dot" [attr.cx]="svg.cx - svg.rx" [attr.cy]="svg.cy" r="4" />
                  <circle class="fig__dot" [attr.cx]="svg.cx + svg.rx" [attr.cy]="svg.cy" r="4" />
                }
              }
            }
            @case ('vertical') {
              @if (svg.kind === 'vertical') {
                <line
                  class="fig__tape"
                  [attr.x1]="svg.x1"
                  [attr.y1]="svg.y1"
                  [attr.x2]="svg.x2"
                  [attr.y2]="svg.y2"
                  pathLength="100"
                />
                @if (active) {
                  <circle class="fig__dot" [attr.cx]="svg.x1" [attr.cy]="svg.y1" r="4" />
                  <circle class="fig__dot" [attr.cx]="svg.x2" [attr.cy]="svg.y2" r="4" />
                  <line
                    class="fig__cap"
                    [attr.x1]="svg.x2 - 12"
                    [attr.y1]="svg.y2"
                    [attr.x2]="svg.x2 + 12"
                    [attr.y2]="svg.y2"
                  />
                }
              }
            }
          }
        </g>
      }
    </svg>
  `,
  styles: `
    :host {
      display: block;
      width: 100%;
      height: 100%;
    }
    .fig {
      width: 100%;
      height: 100%;
    }
    .fig__arm {
      fill: none;
      stroke: #a9a49c;
      stroke-width: 24;
      stroke-linecap: round;
      stroke-linejoin: round;
    }
    .fig__m .fig__tape {
      fill: none;
      stroke: #6a6660;
      stroke-width: 2;
      opacity: 0.6;
    }
    .fig__m .fig__back {
      fill: none;
      stroke: #6a6660;
      stroke-width: 1;
      stroke-dasharray: 3 3;
      opacity: 0.4;
    }
    .fig__m.is-active .fig__tape {
      stroke: var(--red);
      stroke-width: 5;
      opacity: 1;
      stroke-dasharray: 100;
      animation: draw 1.1s cubic-bezier(0.65, 0, 0.35, 1) forwards;
    }
    .fig__m.is-active .fig__back {
      stroke: var(--red);
      opacity: 0.55;
    }
    .fig__dot {
      fill: #fff;
      stroke: var(--red);
      stroke-width: 2;
      animation: pulse 1.8s ease-in-out infinite;
      transform-box: fill-box;
      transform-origin: center;
    }
    .fig__cap {
      stroke: var(--red);
      stroke-width: 2;
    }
    @keyframes draw {
      from {
        stroke-dashoffset: 100;
      }
      to {
        stroke-dashoffset: 0;
      }
    }
    @keyframes pulse {
      50% {
        transform: scale(1.5);
      }
    }
  `,
})
export class MeasurementFigureSvgComponent {
  readonly definitions = input.required<MeasurementDefinition[]>();
  readonly activeId = input<string | null>(null);
  /** Only definitions that have an SVG overlay (body height, for example, has none) */
  readonly drawable = computed(() => this.definitions().filter((d) => !!d.svg));

  activeLabel(): string | undefined {
    return this.definitions().find((d) => d.id === this.activeId())?.label;
  }

  /** Half-ellipse path: front half (lower arc) or back half (upper arc). */
  arc(cx: number, cy: number, rx: number, ry: number, back: boolean): string {
    const sweep = back ? 1 : 0;
    return `M ${cx - rx} ${cy} A ${rx} ${ry} 0 0 ${sweep} ${cx + rx} ${cy}`;
  }
}
