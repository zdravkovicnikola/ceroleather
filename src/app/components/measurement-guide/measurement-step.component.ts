import { ChangeDetectionStrategy, Component, ElementRef, computed, effect, input, output, viewChild } from '@angular/core';
import { MeasurementDefinition } from '../../models/measurement.model';

/** Validation helper shared by the guide and the form. */
export function measurementError(def: MeasurementDefinition, value: number | null): string | null {
  if (value == null || Number.isNaN(value)) return null;
  if (value < def.min || value > def.max) return `Unesite vrednost između ${def.min} i ${def.max} cm.`;
  return null;
}

@Component({
  selector: 'app-measurement-step',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @let d = definition();
    <article class="ms" [attr.aria-labelledby]="'ms-title-' + d.id">
      <header class="ms__head">
        <span class="ms__num">{{ number() }}<small>/{{ total() }}</small></span>
        <div>
          <h3 class="ms__title" [id]="'ms-title-' + d.id">{{ d.label }}</h3>
          <p class="ms__summary">{{ d.summary }}</p>
        </div>
      </header>

      <div class="ms__tape">
        <span class="ms__tape-icon" aria-hidden="true">
          <svg viewBox="0 0 40 24">
            <rect x="1" y="5" width="22" height="14" rx="3" fill="none" stroke="currentColor" stroke-width="1.5" />
            <circle cx="12" cy="12" r="3" fill="currentColor" />
            <path d="M23 13 H39" stroke="#E32126" stroke-width="3" />
            <path d="M27 11v4M31 11v4M35 11v4" stroke="#fff" stroke-width="0.8" />
          </svg>
        </span>
        <p><strong>Gde ide metar:</strong> {{ d.tapePlacement }}</p>
      </div>

      <ol class="ms__steps">
        @for (s of d.instructions; track $index) {
          <li>{{ s }}</li>
        }
      </ol>

      @if (d.tip) {
        <p class="ms__tip"><span>Savet</span>{{ d.tip }}</p>
      }

      <div class="ms__input field">
        <label [for]="'m-' + d.id">
          Vaša mera — {{ d.label }} @if (d.required) {<span class="req">*</span>}
        </label>
        <div class="ms__control" [class.is-invalid]="error()">
          <button type="button" class="ms__step" (click)="nudge(-1)" aria-label="Smanji za 1 cm">−</button>
          <input
            #field
            class="ms__field"
            [id]="'m-' + d.id"
            type="text"
            autocomplete="off"
            inputmode="decimal"
            [placeholder]="d.min + '–' + d.max"
            (input)="onInput($event)"
            [attr.aria-invalid]="!!error()"
            [attr.aria-describedby]="error() ? 'm-err-' + d.id : null"
          />
          <span class="ms__unit">cm</span>
          <button type="button" class="ms__step" (click)="nudge(1)" aria-label="Povećaj za 1 cm">+</button>
        </div>
        @if (error(); as e) {
          <p class="field-error" [id]="'m-err-' + d.id" role="alert">{{ e }}</p>
        }
      </div>
    </article>
  `,
  styleUrl: './measurement-step.component.scss',
})
export class MeasurementStepComponent {
  readonly definition = input.required<MeasurementDefinition>();
  readonly number = input(1);
  readonly total = input(1);
  readonly value = input<number | null>(null);
  readonly valueChange = output<number | null>();

  private readonly field = viewChild<ElementRef<HTMLInputElement>>('field');

  constructor() {
    // Write to the DOM only when the numeric value really differs (keeps partial input like "80." intact).
    effect(() => {
      const v = this.value();
      const el = this.field()?.nativeElement;
      if (!el) return;
      const current = el.value === '' ? null : Number(el.value.replace(',', '.'));
      if (current !== v) el.value = v == null ? '' : String(v);
    });
  }

  readonly error = computed(() => measurementError(this.definition(), this.value()));

  onInput(e: Event): void {
    const raw = (e.target as HTMLInputElement).value.replace(',', '.');
    const n = raw === '' ? null : Number(raw);
    this.valueChange.emit(n == null || Number.isNaN(n) ? null : n);
  }

  nudge(delta: number): void {
    const d = this.definition();
    const current = this.value() ?? Math.round((d.min + d.max) / 2);
    const next = Math.min(d.max, Math.max(d.min, current + (this.value() == null ? 0 : delta)));
    this.valueChange.emit(next);
  }
}
