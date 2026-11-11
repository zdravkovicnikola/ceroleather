import { ChangeDetectionStrategy, Component, input } from '@angular/core';

/**
 * CeroLeather wordmark — "Cero" in brand red script (Damion, inspired by the woven red
 * label), "Leather" in white Anton capitals.
 * Pure text (no image) so it stays crisp and scalable at any size; size via `font-size` on the host.
 */
@Component({
  selector: 'app-logo',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <span class="logo" [class.logo--stacked]="stacked()" role="img" aria-label="CeroLeather">
      <span class="logo__word" aria-hidden="true">
        <span class="logo__cero">Cero</span><span class="logo__leather">Leather</span>
      </span>
      @if (tagline()) {
        <span class="logo__tag" aria-hidden="true">Handmade · Custom · Built for the road</span>
      }
    </span>
  `,
  styles: `
    :host {
      display: inline-block;
      font-size: 26px;
      line-height: 1;
    }
    .logo {
      display: inline-flex;
      flex-direction: column;
      gap: 0.32em;
    }
    .logo__word {
      display: inline-flex;
      align-items: baseline;
      font-family: var(--font-display);
      text-transform: uppercase;
      letter-spacing: 0.01em;
      font-size: 1em;
      white-space: nowrap;
    }
    .logo__cero {
      color: var(--red);
      font-family: var(--font-script);
      font-weight: 400;
      text-transform: none;
      letter-spacing: 0;
      /* script x-height is smaller than Anton caps — scale up to keep the old visual balance */
      font-size: 1.22em;
      line-height: 0.8;
      padding-right: 0.06em;
      margin-bottom: -0.04em;
    }
    .logo__leather {
      color: var(--text);
      letter-spacing: 0.04em;
    }
    .logo__tag {
      font-family: var(--font-mono);
      font-size: 0.26em;
      letter-spacing: 0.32em;
      text-transform: uppercase;
      color: var(--silver);
      padding-top: 0.5em;
    }
  `,
})
export class LogoComponent {
  readonly tagline = input(false);
  readonly stacked = input(false);
}
