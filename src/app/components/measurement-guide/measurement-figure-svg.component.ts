import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { MeasurementDefinition } from '../../models/measurement.model';

/**
 * Animated SVG fallback for the measurement guide (no WebGL / low-end devices).
 * Coordinates come from each definition's `svg` field (viewBox 0 0 300 400).
 */
@Component({
  selector: 'app-measurement-figure-svg',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <svg viewBox="0 0 300 400" class="fig" role="img" [attr.aria-label]="'Prikaz mere: ' + (activeLabel() ?? '')">
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

      @for (m of definitions(); track m.id) {
        @let active = m.id === activeId();
        <g class="fig__m" [class.is-active]="active">
          @switch (m.svg.kind) {
            @case ('ring') {
              @if (m.svg.kind === 'ring') {
                <!-- back half (behind the body) -->
                <path
                  class="fig__back"
                  [attr.d]="arc(m.svg.cx, m.svg.cy, m.svg.rx, m.svg.ry, true)"
                  pathLength="100"
                />
                <!-- front half -->
                <path class="fig__tape" [attr.d]="arc(m.svg.cx, m.svg.cy, m.svg.rx, m.svg.ry, false)" pathLength="100" />
                @if (active) {
                  <circle class="fig__dot" [attr.cx]="m.svg.cx - m.svg.rx" [attr.cy]="m.svg.cy" r="4" />
                  <circle class="fig__dot" [attr.cx]="m.svg.cx + m.svg.rx" [attr.cy]="m.svg.cy" r="4" />
                }
              }
            }
            @case ('vertical') {
              @if (m.svg.kind === 'vertical') {
                <line
                  class="fig__tape"
                  [attr.x1]="m.svg.x1"
                  [attr.y1]="m.svg.y1"
                  [attr.x2]="m.svg.x2"
                  [attr.y2]="m.svg.y2"
                  pathLength="100"
                />
                @if (active) {
                  <circle class="fig__dot" [attr.cx]="m.svg.x1" [attr.cy]="m.svg.y1" r="4" />
                  <circle class="fig__dot" [attr.cx]="m.svg.x2" [attr.cy]="m.svg.y2" r="4" />
                  <line
                    class="fig__cap"
                    [attr.x1]="m.svg.x2 - 12"
                    [attr.y1]="m.svg.y2"
                    [attr.x2]="m.svg.x2 + 12"
                    [attr.y2]="m.svg.y2"
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

  activeLabel(): string | undefined {
    return this.definitions().find((d) => d.id === this.activeId())?.label;
  }

  /** Half-ellipse path: front half (lower arc) or back half (upper arc). */
  arc(cx: number, cy: number, rx: number, ry: number, back: boolean): string {
    const sweep = back ? 1 : 0;
    return `M ${cx - rx} ${cy} A ${rx} ${ry} 0 0 ${sweep} ${cx + rx} ${cy}`;
  }
}
