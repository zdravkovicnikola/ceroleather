import { ChangeDetectionStrategy, Component, DestroyRef, inject, signal } from '@angular/core';
import { NavigationEnd, Router, RouterLink, RouterLinkActive } from '@angular/router';
import { LogoComponent } from '../../shared/components/logo.component';

interface NavItem {
  label: string;
  link: string;
  fragment?: string;
  exact?: boolean;
}

@Component({
  selector: 'app-header',
  imports: [RouterLink, RouterLinkActive, LogoComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss',
})
export class HeaderComponent {
  readonly nav: NavItem[] = [
    { label: 'Početna', link: '/', exact: true },
    { label: 'Katalog', link: '/katalog' },
    { label: 'Po meri', link: '/porudzbina' },
    { label: 'Kontakt', link: '/', fragment: 'kontakt' },
  ];

  readonly scrolled = signal(false);
  readonly hidden = signal(false);
  readonly menuOpen = signal(false);

  constructor() {
    let last = 0;
    const onScroll = () => {
      const y = window.scrollY;
      this.scrolled.set(y > 40);
      this.hidden.set(!this.menuOpen() && y > 400 && y > last + 2);
      if (y < last - 2) this.hidden.set(false);
      last = y;
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    const sub = inject(Router).events.subscribe((e) => {
      if (e instanceof NavigationEnd) this.closeMenu();
    });
    inject(DestroyRef).onDestroy(() => {
      window.removeEventListener('scroll', onScroll);
      sub.unsubscribe();
    });
  }

  toggleMenu(): void {
    this.menuOpen.update((v) => !v);
    document.documentElement.style.overflow = this.menuOpen() ? 'hidden' : '';
  }

  closeMenu(): void {
    this.menuOpen.set(false);
    document.documentElement.style.overflow = '';
  }
}
