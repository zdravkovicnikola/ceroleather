import { isPlatformBrowser } from '@angular/common';
import { ChangeDetectionStrategy, Component, DestroyRef, PLATFORM_ID, inject } from '@angular/core';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { filter } from 'rxjs';
import { FooterComponent } from './components/footer/footer.component';
import { HeaderComponent } from './components/header/header.component';
import { ScrollService } from './core/services/scroll.service';
import { SeoService } from './core/seo/seo.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, HeaderComponent, FooterComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <a class="skip-link" href="#main">Preskoči na sadržaj</a>
    <app-header />
    <main id="main">
      <router-outlet />
    </main>
    <app-footer />
  `,
  styles: `
    .skip-link {
      position: fixed;
      top: 8px;
      left: 8px;
      z-index: 200;
      padding: 10px 16px;
      background: var(--red);
      color: #fff;
      transform: translateY(-200%);
    }
    .skip-link:focus {
      transform: none;
    }
    main {
      display: block;
      min-height: 100vh;
    }
  `,
})
export class App {
  private readonly scroll = inject(ScrollService);

  constructor() {
    const destroyRef = inject(DestroyRef);
    this.scroll.init(destroyRef);

    const router = inject(Router);
    const seo = inject(SeoService);
    const isBrowser = isPlatformBrowser(inject(PLATFORM_ID));
    const sub = router.events
      .pipe(filter((e): e is NavigationEnd => e instanceof NavigationEnd))
      .subscribe(() => {
        // Route-level title / description / canonical / Open Graph (pages may refine it, e.g. products)
        seo.applyRouteData(router.routerState.snapshot.root, router.url);
        if (!isBrowser) return;
        const fragment = router.parseUrl(router.url).fragment;
        if (fragment) {
          // wait for the routed view to render
          setTimeout(() => this.scroll.scrollTo(`#${fragment}`), 120);
        } else {
          this.scroll.scrollToTop();
        }
        setTimeout(() => this.scroll.refresh(), 300);
      });
    destroyRef.onDestroy(() => sub.unsubscribe());
  }
}
