import { Routes } from '@angular/router';
import { SEO_KEY, SeoData } from './core/seo/seo.service';

/**
 * URLs are unchanged from the original site. SEO texts (Serbian) live next to each route;
 * product pages build theirs from products.data.ts (see ProductDetailPage).
 */
const seo = (data: SeoData) => ({ [SEO_KEY]: data });

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./pages/home/home.page').then((m) => m.HomePage),
    data: seo({
      title: 'CeroLeather — kožni prsluci i jakne po meri, ručna izrada',
      description:
        'Ručno izrađeni kožni motociklistički prsluci i jakne, kreirani po vašoj meri. Izaberite model, izmerite se uz vodič i pošaljite zahtev za porudžbinu.',
      path: '/',
      jsonLd: [
        {
          '@context': 'https://schema.org',
          '@type': 'WebSite',
          name: 'CeroLeather',
          inLanguage: 'sr-Latn-RS',
        },
      ],
    }),
  },
  {
    path: 'katalog',
    loadComponent: () => import('./pages/catalog/catalog.page').then((m) => m.CatalogPage),
    data: seo({
      title: 'Katalog — kožni prsluci, jakne i custom modeli | CeroLeather',
      description:
        'Pogledajte CeroLeather modele kožnih prsluka i jakni. Svaki komad se izrađuje ručno, po vašim merama i željama.',
      path: '/katalog',
    }),
  },
  {
    path: 'katalog/:slug',
    loadComponent: () =>
      import('./pages/product-detail/product-detail.page').then((m) => m.ProductDetailPage),
    data: { seoManaged: true },
  },
  {
    path: 'o-nama',
    loadComponent: () => import('./pages/about/about.page').then((m) => m.AboutPage),
    data: seo({
      title: 'O nama — CeroLeather',
      description:
        'Upoznajte CeroLeather: ručna izrada kožnih prsluka i jakni po meri, pažnja prema detaljima i kvalitetu.',
      path: '/o-nama',
      type: 'article',
    }),
  },
  {
    path: 'porudzbina',
    loadComponent: () => import('./pages/order/order.page').then((m) => m.OrderPage),
    data: seo({
      title: 'Porudžbina po meri — mere i zahtev | CeroLeather',
      description:
        'Izmerite se uz naš vodič (dužina prsluka, obim struka i stomaka) i pošaljite zahtev za kožni prsluk ili jaknu po meri. Porudžbina se potvrđuje nakon dogovora i avansa.',
      path: '/porudzbina',
    }),
  },
  {
    path: '**',
    loadComponent: () => import('./pages/not-found/not-found.page').then((m) => m.NotFoundPage),
    data: seo({
      title: 'Stranica nije pronađena — CeroLeather',
      description:
        'Tražena stranica ne postoji. Pogledajte katalog CeroLeather kožnih prsluka i jakni.',
      noindex: true,
    }),
  },
];
