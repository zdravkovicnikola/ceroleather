import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { SITE_CONFIG } from '../../core/config/site.config';
import { CATEGORIES } from '../../data/categories.data';
import { LogoComponent } from '../../shared/components/logo.component';

@Component({
  selector: 'app-footer',
  imports: [RouterLink, LogoComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <footer class="footer">
      <div class="footer__marquee" aria-hidden="true">
        <div class="footer__marquee-track">
          @for (i of [1, 2, 3, 4]; track i) {
            <span>Handmade</span><span class="dot"></span><span>Custom</span><span class="dot"></span
            ><span>Built for the road</span><span class="dot"></span>
          }
        </div>
      </div>

      <div class="container footer__grid">
        <div class="footer__brand">
          <app-logo [tagline]="true" />
          <p class="footer__statement">{{ site.statement }}</p>
        </div>

        <nav class="footer__col" aria-label="Footer navigacija">
          <h3 class="footer__title">Navigacija</h3>
          <a routerLink="/" class="link-underline">Početna</a>
          <a routerLink="/katalog" class="link-underline">Katalog</a>
          <a routerLink="/porudzbina" class="link-underline">Porudžbina po meri</a>
          <a routerLink="/" fragment="kontakt" class="link-underline">Kontakt</a>
        </nav>

        <nav class="footer__col" aria-label="Kategorije">
          <h3 class="footer__title">Kolekcija</h3>
          @for (c of categories; track c.id) {
            <a routerLink="/katalog" [queryParams]="{ kategorija: c.id }" class="link-underline">{{ c.label }}</a>
          }
        </nav>

        <div class="footer__col">
          <h3 class="footer__title">Kontakt</h3>
          <a [href]="'mailto:' + site.contactEmail" class="link-underline">{{ site.contactEmail }}</a>
          <a [href]="site.instagramUrl" target="_blank" rel="noopener" class="link-underline">Instagram {{ site.instagramHandle }}</a>
        </div>
      </div>

      <div class="container footer__bottom">
        <span>© {{ year }} {{ site.brandName }}</span>
        <span>{{ site.tagline }}</span>
      </div>
    </footer>
  `,
  styleUrl: './footer.component.scss',
})
export class FooterComponent {
  readonly site = SITE_CONFIG;
  readonly categories = CATEGORIES;
  readonly year = new Date().getFullYear();
}
