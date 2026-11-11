import { DOCUMENT } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  afterNextRender,
  inject,
  signal,
} from '@angular/core';
import { NavigationEnd, Router, RouterLink, RouterLinkActive } from '@angular/router';
import { SITE_CONFIG } from '../../core/config/site.config';
import { InstagramIconComponent } from '../../shared/components/instagram-icon.component';
import { LogoComponent } from '../../shared/components/logo.component';

interface NavItem {
  label: string;
  link: string;
  exact?: boolean;
}

@Component({
  selector: 'app-header',
  imports: [RouterLink, RouterLinkActive, LogoComponent, InstagramIconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss',
})
export class HeaderComponent {
  readonly nav: NavItem[] = [
    { label: 'Početna', link: '/', exact: true },
    { label: 'Katalog', link: '/katalog' },
    { label: 'O nama', link: '/o-nama' },
    { label: 'Po meri', link: '/porudzbina' },
  ];

  readonly instagramUrl = SITE_CONFIG.instagramUrl;
  readonly instagramHandle = SITE_CONFIG.instagramHandle;

  readonly scrolled = signal(false);
  readonly hidden = signal(false);
  readonly menuOpen = signal(false);

  private readonly doc = inject(DOCUMENT);

  constructor() {
    const destroyRef = inject(DestroyRef);
    const sub = inject(Router).events.subscribe((e) => {
      if (e instanceof NavigationEnd) this.closeMenu();
    });
    destroyRef.onDestroy(() => sub.unsubscribe());

    // Browser only (the page is also prerendered on the server).
    afterNextRender(() => {
      // Hide-on-scroll is a desktop nicety only. On phones/tablets the header must stay
      // reachable at all times, otherwise the menu is lost far down the page.
      const desktop = window.matchMedia('(min-width: 961px)');
      let last = window.scrollY;
      const onScroll = () => {
        const y = window.scrollY;
        this.scrolled.set(y > 40);
        if (!desktop.matches || this.menuOpen() || y < 400) this.hidden.set(false);
        else if (y > last + 2) this.hidden.set(true);
        else if (y < last - 2) this.hidden.set(false);
        last = y;
      };
      onScroll();
      window.addEventListener('scroll', onScroll, { passive: true });
      destroyRef.onDestroy(() => window.removeEventListener('scroll', onScroll));
    });
  }

  toggleMenu(): void {
    this.menuOpen.update((v) => !v);
    this.doc.documentElement.style.overflow = this.menuOpen() ? 'hidden' : '';
    if (this.menuOpen()) this.hidden.set(false);
  }

  closeMenu(): void {
    this.menuOpen.set(false);
    this.doc.documentElement.style.overflow = '';
  }
}
