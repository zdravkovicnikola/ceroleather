import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RevealDirective } from '../../shared/directives/reveal.directive';

@Component({
  selector: 'app-process',
  imports: [RevealDirective],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="process section" aria-labelledby="process-title">
      <div class="container process__inner">
        <div class="process__head">
          <p class="eyebrow" appReveal="fade">Po meri</p>
          <h2 id="process-title" class="display display--md" appReveal="lines">
            <span class="line"><span>Od mere</span></span>
            <span class="line"><span>do <span class="text-red">vašeg</span> komada</span></span>
          </h2>
          <p class="lead" appReveal="up">
            Bez tabela veličina i nagađanja. Naš vodič vam pokazuje tačno gde i kako da se izmerite.
          </p>
        </div>
        <ol class="process__steps" appReveal="stagger">
          @for (s of steps; track s.title; let i = $index) {
            <li class="step">
              <span class="step__num">{{ i + 1 }}</span>
              <div>
                <h3 class="step__title">{{ s.title }}</h3>
                <p class="step__text">{{ s.text }}</p>
              </div>
            </li>
          }
        </ol>
      </div>
    </section>
  `,
  styles: `
    .process {
      background: var(--bg-2);
      border-block: 1px solid var(--line);
    }
    .process__inner {
      display: grid;
      grid-template-columns: 5fr 7fr;
      gap: clamp(40px, 6vw, 120px);
      align-items: start;
    }
    .process__head {
      position: sticky;
      top: calc(var(--header-h) + 40px);
    }
    .process__head .lead {
      margin-top: 28px;
    }
    .process__steps {
      list-style: none;
      margin: 0;
      padding: 0;
    }
    .step {
      display: grid;
      grid-template-columns: 90px 1fr;
      gap: 24px;
      padding-block: 40px;
      border-top: 1px solid var(--line);
    }
    .step:last-child {
      border-bottom: 1px solid var(--line);
    }
    .step__num {
      font-family: var(--font-display);
      font-size: 4.5rem;
      line-height: 0.85;
      color: transparent;
      -webkit-text-stroke: 1px var(--red);
    }
    .step__title {
      margin: 0 0 10px;
      font-family: var(--font-display);
      font-weight: 400;
      text-transform: uppercase;
      font-size: clamp(1.5rem, 2.4vw, 2.1rem);
      line-height: 1;
    }
    .step__text {
      margin: 0;
      color: var(--text-2);
      font-weight: 300;
      max-width: 34em;
    }
    @media (max-width: 900px) {
      .process__inner {
        grid-template-columns: 1fr;
      }
      .process__head {
        position: static;
      }
      .step {
        grid-template-columns: 64px 1fr;
      }
      .step__num {
        font-size: 3.2rem;
      }
    }
  `,
})
export class ProcessComponent {
  readonly steps = [
    { title: 'Izaberite model', text: 'Pronađite model iz kataloga ili opišite svoju ideju za custom komad.' },
    { title: 'Izmerite se', text: 'Interaktivni 3D vodič vam pokazuje gde ide metar za svaku meru, korak po korak.' },
    { title: 'Pošaljite upit', text: 'Mere, model i vaše želje stižu direktno u radionicu.' },
    { title: 'Dogovor i izrada', text: 'Javljamo vam se da potvrdimo detalje, a zatim počinje ručna izrada.' },
  ];
}
