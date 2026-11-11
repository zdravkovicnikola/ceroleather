import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    title: 'CeroLeather — Made for the road. Built to be yours.',
    loadComponent: () => import('./pages/home/home.page').then((m) => m.HomePage),
  },
  {
    path: 'katalog',
    title: 'Katalog — CeroLeather',
    loadComponent: () => import('./pages/catalog/catalog.page').then((m) => m.CatalogPage),
  },
  {
    path: 'katalog/:slug',
    loadComponent: () => import('./pages/product-detail/product-detail.page').then((m) => m.ProductDetailPage),
  },
  {
    path: 'porudzbina',
    title: 'Porudžbina po meri — CeroLeather',
    loadComponent: () => import('./pages/order/order.page').then((m) => m.OrderPage),
  },
  {
    path: '**',
    title: 'Stranica nije pronađena — CeroLeather',
    loadComponent: () => import('./pages/not-found/not-found.page').then((m) => m.NotFoundPage),
  },
];
