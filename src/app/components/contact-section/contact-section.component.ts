import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { SITE_CONFIG } from '../../core/config/site.config';
import { InstagramIconComponent } from '../../shared/components/instagram-icon.component';
import { LogoComponent } from '../../shared/components/logo.component';
import { ParallaxDirective } from '../../shared/directives/parallax.directive';
import { RevealDirective } from '../../shared/directives/reveal.directive';

@Component({
  selector: 'app-contact-section',
  imports: [RouterLink, LogoComponent, RevealDirective, ParallaxDirective, InstagramIconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section id="kontakt" class="contact" aria-labelledby="contact-title">
      <div class="contact__media" aria-hidden="true">
        <img
          appParallax
          [parallaxAmount]="14"
          src="assets/images/products/rider-vest-front-open.webp"
          alt=""
          loading="lazy"
        />
      </div>
      <div class="container contact__inner">
        <p class="eyebrow" appReveal="fade">Kontakt</p>
        <h2 id="contact-title" class="display display--xl contact__title" appReveal="lines">
          <span class="line"><span>Tvoja mera.</span></span>
          <span class="line"><span>Tvoj stil.</span></span>
          <span class="line"
            ><span>Tvoj <span class="text-red">Cero</span>Leather.</span></span
          >
        </h2>

        <div class="contact__grid" appReveal="stagger">
          <div class="contact__cta">
            <p class="lead">
              Imate ideju za prsluk ili jaknu? Pošaljite mere i želje — napravićemo komad samo za
              vas.
            </p>
            <a routerLink="/porudzbina" class="btn btn--primary"
              >Zatraži komad po meri <span class="btn__arrow"></span
            ></a>
          </div>
          <dl class="contact__details">
            <div>
              <dt>Email</dt>
              <dd>
                <a [href]="'mailto:' + site.contactEmail" class="link-underline">{{
                  site.contactEmail
                }}</a>
              </dd>
            </div>
            <div>
              <dt>Instagram</dt>
              <dd>
                <a
                  [href]="site.instagramUrl"
                  target="_blank"
                  rel="noopener noreferrer"
                  class="contact__ig"
                  aria-label="CeroLeather na Instagramu (otvara se u novom prozoru)"
                >
                  <app-instagram-icon />
                  <span class="link-underline">{{ site.instagramHandle }}</span>
                </a>
              </dd>
            </div>
            <div>
              <dt>Navigacija</dt>
              <dd class="contact__nav">
                <a routerLink="/katalog" class="link-underline">Katalog</a>
                <a routerLink="/o-nama" class="link-underline">O nama</a>
                <a routerLink="/porudzbina" class="link-underline">Po meri</a>
              </dd>
            </div>
          </dl>
          <div class="contact__brand">
            <app-logo [tagline]="true" />
          </div>
        </div>
      </div>
    </section>
  `,
  styles: `
    .contact {
      position: relative;
      overflow: hidden;
      padding-block: clamp(120px, 16vw, 240px) clamp(80px, 10vw, 140px);
      isolation: isolate;
    }
    .contact__ig {
      display: inline-flex;
      align-items: center;
      gap: 10px;
    }
    .contact__ig app-instagram-icon {
      color: var(--red);
      font-size: 1.2em;
    }
    .contact__media {
      position: absolute;
      inset: 0;
      z-index: -1;
    }
    .contact__media img {
      position: absolute;
      right: -5%;
      top: -10%;
      width: 60%;
      height: 120%;
      object-fit: cover;
      filter: grayscale(0.4) brightness(0.32) contrast(1.15);
      mask-image: linear-gradient(90deg, transparent, #000 50%);
    }
    .contact__title {
      margin-bottom: clamp(56px, 7vw, 110px);
    }
    .contact__grid {
      display: grid;
      grid-template-columns: 1.3fr 1fr auto;
      gap: clamp(32px, 5vw, 80px);
      align-items: end;
      border-top: 1px solid var(--line);
      padding-top: 48px;
    }
    .contact__cta .lead {
      margin: 0 0 28px;
    }
    .contact__details {
      margin: 0;
      display: grid;
      gap: 22px;
    }
    .contact__details dt {
      font-family: var(--font-mono);
      font-size: 0.66rem;
      letter-spacing: 0.24em;
      text-transform: uppercase;
      color: var(--text-3);
      margin-bottom: 6px;
    }
    .contact__details dd {
      margin: 0;
      font-size: 1.1rem;
    }
    .contact__nav {
      display: flex;
      gap: 20px;
    }
    .contact__brand app-logo {
      font-size: 34px;
    }
    @media (max-width: 900px) {
      .contact__grid {
        grid-template-columns: 1fr;
      }
      .contact__media img {
        width: 100%;
        right: 0;
        mask-image: linear-gradient(180deg, transparent, #000 60%);
      }
    }
  `,
})
export class ContactSectionComponent {
  readonly site = SITE_CONFIG;
}
