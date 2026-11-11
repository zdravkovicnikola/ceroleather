import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { SITE_CONFIG } from '../../core/config/site.config';
import { ScrollService } from '../../core/services/scroll.service';
import { ABOUT_INTRO, ABOUT_SECTIONS } from '../../data/about.data';
import { InstagramIconComponent } from '../../shared/components/instagram-icon.component';
import { ParallaxDirective } from '../../shared/directives/parallax.directive';
import { RevealDirective } from '../../shared/directives/reveal.directive';

/** "O nama" — content comes from data/about.data.ts */
@Component({
  selector: 'app-about-page',
  imports: [RouterLink, RevealDirective, ParallaxDirective, InstagramIconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="ab-hero container" aria-labelledby="ab-title">
      <p class="eyebrow" appReveal="fade">{{ intro.eyebrow }}</p>
      <h1 id="ab-title" class="display display--xl" appReveal="lines">
        @for (l of intro.titleLines; track $index; let last = $last) {
          <span class="line"
            ><span [class.text-red]="last">{{ l }}</span></span
          >
        }
      </h1>
      <p class="lead ab-hero__lead" appReveal="up">{{ intro.lead }}</p>

      <nav class="ab-toc" aria-label="Sadržaj stranice" appReveal="up">
        @for (s of sections; track s.id) {
          <a [href]="'#' + s.id" class="link-underline" (click)="jump($event, s.id)">{{
            s.title
          }}</a>
        }
        <a href="#kontakt-info" class="link-underline" (click)="jump($event, 'kontakt-info')"
          >Kontakt</a
        >
      </nav>
    </section>

    @for (s of sections; track s.id; let i = $index; let odd = $odd) {
      <section
        class="ab-sec container"
        [class.ab-sec--flip]="odd"
        [id]="s.id"
        [attr.aria-labelledby]="s.id + '-title'"
      >
        @if (s.image; as img) {
          <figure class="ab-sec__media" appReveal="image">
            <img
              appParallax
              [parallaxAmount]="8"
              [src]="img.src"
              [srcset]="img.srcSm + ' 760w, ' + img.src + ' 1600w'"
              sizes="(max-width: 900px) 92vw, 46vw"
              [alt]="img.alt"
              loading="lazy"
            />
          </figure>
        }
        <div class="ab-sec__body" appReveal="up">
          <p class="eyebrow">{{ s.eyebrow }}</p>
          <h2 class="display display--lg" [id]="s.id + '-title'">{{ s.title }}</h2>
          @for (p of s.paragraphs; track $index) {
            <p class="ab-sec__p">{{ p }}</p>
          }
          @if (s.points?.length) {
            <ul class="ab-sec__points">
              @for (pt of s.points; track pt) {
                <li>{{ pt }}</li>
              }
            </ul>
          }
        </div>
      </section>
    }

    <section id="kontakt-info" class="ab-contact container" aria-labelledby="ab-contact-title">
      <div appReveal="up">
        <p class="eyebrow">05 — Kontakt</p>
        <h2 id="ab-contact-title" class="display display--lg">
          Hajde da napravimo <span class="text-red">vaš komad</span>
        </h2>
        <p class="ab-sec__p">
          Pošaljite mere i želje kroz formu za porudžbinu — javićemo vam se telefonom radi dogovora
          o detaljima i avansu.
        </p>
      </div>
      <dl class="ab-contact__list" appReveal="stagger">
        <div>
          <dt>Instagram</dt>
          <dd>
            <a
              [href]="site.instagramUrl"
              target="_blank"
              rel="noopener noreferrer"
              class="ab-contact__ig"
              aria-label="CeroLeather na Instagramu (otvara se u novom prozoru)"
            >
              <app-instagram-icon /> <span class="link-underline">{{ site.instagramHandle }}</span>
            </a>
          </dd>
        </div>
        <div>
          <dt>Email</dt>
          <dd>
            <a [href]="'mailto:' + site.contactEmail" class="link-underline">{{
              site.contactEmail
            }}</a>
          </dd>
        </div>
        <div>
          <dt>Porudžbina</dt>
          <dd>
            <a routerLink="/porudzbina" class="btn btn--primary btn--sm"
              >Zatraži komad po meri <span class="btn__arrow"></span
            ></a>
          </dd>
        </div>
      </dl>
    </section>
  `,
  styles: `
    .ab-hero {
      padding-top: calc(var(--header-h) + clamp(60px, 9vw, 130px));
      padding-bottom: clamp(56px, 7vw, 110px);
    }
    .ab-hero__lead {
      margin-top: 32px;
      max-width: 36em;
    }
    .ab-toc {
      display: flex;
      flex-wrap: wrap;
      gap: 12px 28px;
      margin-top: 44px;
      padding-top: 24px;
      border-top: 1px solid var(--line);
      font-family: var(--font-mono);
      font-size: 0.7rem;
      letter-spacing: 0.18em;
      text-transform: uppercase;
      color: var(--text-2);
    }
    .ab-sec {
      display: grid;
      grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
      gap: clamp(32px, 6vw, 110px);
      align-items: center;
      padding-block: clamp(56px, 8vw, 130px);
      border-top: 1px solid var(--line);
      scroll-margin-top: calc(var(--header-h) + 20px);
    }
    .ab-sec--flip .ab-sec__media {
      order: 2;
    }
    .ab-sec__media {
      margin: 0;
      aspect-ratio: 4 / 5;
      overflow: hidden;
      background: var(--bg-2);
    }
    .ab-sec__media img {
      width: 100%;
      height: 115%;
      object-fit: cover;
      filter: brightness(0.88) contrast(1.06) saturate(0.85);
    }
    .ab-sec__body .display {
      margin: 14px 0 24px;
    }
    .ab-sec__body .eyebrow {
      color: var(--red);
    }
    .ab-sec__p {
      margin: 0 0 16px;
      max-width: 34em;
      color: var(--text-2);
      font-weight: 300;
      font-size: 1.05rem;
      line-height: 1.7;
    }
    .ab-sec__points {
      list-style: none;
      margin: 24px 0 0;
      padding: 0;
      border-top: 1px solid var(--line);
    }
    .ab-sec__points li {
      position: relative;
      padding: 14px 0 14px 28px;
      border-bottom: 1px solid var(--line);
    }
    .ab-sec__points li::before {
      content: '';
      position: absolute;
      left: 0;
      top: 50%;
      width: 12px;
      height: 1px;
      background: var(--red);
    }
    .ab-contact {
      display: grid;
      grid-template-columns: minmax(0, 1.2fr) minmax(0, 1fr);
      gap: clamp(32px, 6vw, 110px);
      padding-block: clamp(64px, 9vw, 150px);
      border-top: 1px solid var(--line);
      scroll-margin-top: calc(var(--header-h) + 20px);
    }
    .ab-contact .display {
      margin: 14px 0 24px;
    }
    .ab-contact .eyebrow {
      color: var(--red);
    }
    .ab-contact__list {
      display: grid;
      gap: 28px;
      margin: 0;
      align-content: start;
    }
    .ab-contact__list dt {
      font-family: var(--font-mono);
      font-size: 0.66rem;
      letter-spacing: 0.24em;
      text-transform: uppercase;
      color: var(--text-3);
      margin-bottom: 8px;
    }
    .ab-contact__list dd {
      margin: 0;
      font-size: 1.1rem;
    }
    .ab-contact__ig {
      display: inline-flex;
      align-items: center;
      gap: 10px;
    }
    .ab-contact__ig app-instagram-icon {
      color: var(--red);
      font-size: 1.2em;
    }
    @media (max-width: 900px) {
      .ab-sec,
      .ab-contact {
        grid-template-columns: minmax(0, 1fr);
      }
      .ab-sec--flip .ab-sec__media {
        order: 0;
      }
    }
  `,
})
export class AboutPage {
  readonly intro = ABOUT_INTRO;
  readonly sections = ABOUT_SECTIONS;
  readonly site = SITE_CONFIG;
  private readonly scroll = inject(ScrollService);

  /** In-page anchors without changing the route (smooth, Lenis- and header-aware) */
  jump(e: Event, id: string): void {
    e.preventDefault();
    this.scroll.scrollTo(`#${id}`, -90);
  }
}
