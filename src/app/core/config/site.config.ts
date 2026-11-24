/**
 * Central brand / site configuration.
 * Change contact details, social links and pricing behaviour here.
 */
export const SITE_CONFIG = {
  brandName: 'CeroLeather',
  tagline: 'Handmade. Custom. Built for the road.',
  statement:
    'Ručno izrađeni kožni prsluci. Kreirani po vašoj meri — za vožnju, za put, za vas.',
  /** Public contact address shown on the site. TODO: replace with the real business inbox. */
  contactEmail: 'porudzbine@ceroleather.rs',
  instagramUrl: 'https://www.instagram.com/ceroleather/',
  instagramHandle: '@ceroleather',
  facebookUrl: 'https://www.facebook.com/profile.php?id=61584107372552',

  /** Prices are optional. Set to true and fill `price` on products to show them. */
  showPrices: true,
  currency: 'RSD',
} as const;
