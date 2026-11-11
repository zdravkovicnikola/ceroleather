import { ChangeDetectionStrategy, Component } from '@angular/core';

/** Instagram glyph (outline camera), inherits `currentColor`, size via `font-size` / width. */
@Component({
  selector: 'app-instagram-icon',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <rect x="2.75" y="2.75" width="18.5" height="18.5" rx="5.25" />
      <circle cx="12" cy="12" r="4.25" />
      <circle class="dot" cx="17.4" cy="6.6" r="1.1" />
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
    }
    .dot {
      fill: currentColor;
      stroke: none;
    }
  `,
})
export class InstagramIconComponent {}
