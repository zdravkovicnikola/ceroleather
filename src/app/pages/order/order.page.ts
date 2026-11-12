import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { MeasurementGuideComponent } from '../../components/measurement-guide/measurement-guide.component';
import { OrderFormComponent } from '../../components/order-form/order-form.component';
import { ScrollService } from '../../core/services/scroll.service';
import { OrderMode } from '../../models/order-request.model';
import { RevealDirective } from '../../shared/directives/reveal.directive';

@Component({
  selector: 'app-order-page',
  imports: [OrderFormComponent, MeasurementGuideComponent, RevealDirective],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="op-hero container">
      <p class="eyebrow" appReveal="fade">Po meri</p>
      <h1 class="display display--xl" appReveal="lines">
        <span class="line"><span>Vaš komad</span></span>
        <span class="line"><span class="text-red">počinje ovde.</span></span>
      </h1>
      <p class="lead" appReveal="up">
        Izmerite se uz naš vodič, izaberite model ili opišite svoju ideju i pošaljite zahtev.
        Javljamo vam se telefonom radi dogovora o detaljima i obaveznom avansu.
      </p>
    </section>

    <div class="op container">
      <aside class="op__guide" aria-label="Vodič za merenje">
        <div class="op__sticky">
          <app-measurement-guide (proceed)="toForm()" />
        </div>
      </aside>
      <section id="porudzbina-forma" class="op__form">
        <app-order-form
          [mode]="mode()"
          [presetSlug]="mode() === 'catalog' ? proizvod() : null"
          [presetCategory]="mode() === 'custom' ? kategorija() : null"
        />
      </section>
    </div>
  `,
  styles: `
    .op-hero {
      padding-top: calc(var(--header-h) + clamp(60px, 9vw, 130px));
      padding-bottom: clamp(48px, 6vw, 90px);
    }
    .op-hero .lead {
      margin-top: 32px;
    }
    .op {
      display: grid;
      grid-template-columns: minmax(0, 1fr) minmax(0, 1.1fr);
      gap: clamp(32px, 5vw, 88px);
      align-items: start;
      padding-bottom: clamp(100px, 12vw, 180px);
    }
    @media (max-width: 1000px) {
      .op {
        grid-template-columns: minmax(0, 1fr);
      }
      .op__sticky {
        position: static;
      }
    }
  `,
})
export class OrderPage {
  /**
   * ?zahtev=katalog → request for an existing catalog model (with ?proizvod=<slug>)
   * ?zahtev=custom (or no parameter) → entirely new custom design
   * The mode is part of the URL, so it survives a page refresh and never leaks between visits.
   */
  readonly zahtev = input<string | undefined>();
  readonly mode = computed<OrderMode>(() => (this.zahtev() === 'katalog' ? 'catalog' : 'custom'));
  /** ?proizvod=<slug> */
  readonly proizvod = input<string | undefined>();
  /** ?kategorija=<id> */
  readonly kategorija = input<string | undefined>();

  private readonly scroll = inject(ScrollService);

  toForm(): void {
    this.scroll.scrollTo('#porudzbina-forma', -100);
  }
}
