import { ChangeDetectionStrategy, Component } from '@angular/core';

/** Facebook glyph (outline circle + "f"), same stroke style as the Instagram icon; inherits `currentColor`. */
@Component({
  selector: 'app-facebook-icon',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <circle cx="12" cy="12" r="9.25" />
      <path d="M13.6 21.2v-10c0-1.85.95-2.75 2.75-2.75h1.25" />
      <path d="M10.2 13.1h6.1" />
    </svg>
  `,
  styles: `
    :host {
      display: inline-block;
      width: 1.15em;
      height: 1.15em;
      flex: none;
      vertical-align: -0.2em;
    }
    svg {
      width: 100%;
      height: 100%;
      fill: none;
      stroke: currentColor;
      stroke-width: 1.7;
      stroke-linecap: round;
    }
  `,
})
export class FacebookIconComponent {}
