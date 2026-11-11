/**
 * Central brand / site configuration.
 * Change contact details, social links and pricing behaviour here.
 */
export const SITE_CONFIG = {
  brandName: 'CeroLeather',
  tagline: 'Handmade. Custom. Built for the road.',
  statement:
    'Ručno izrađeni kožni prsluci i jakne. Kreirani po vašoj meri — za vožnju, za put, za vas.',
  /** Public contact address shown on the site. TODO: replace with the real business inbox. */
  contactEmail: 'kontakt@ceroleather.com',
  instagramUrl: 'https://www.instagram.com/ceroleather/',
  instagramHandle: '@ceroleather',

  /** Prices are optional. Set to true and fill `price` on products to show them. */
  showPrices: false,
  currency: 'RSD',
} as const;
