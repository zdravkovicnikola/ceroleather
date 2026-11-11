import { environment } from '../../../environments/environment';

/**
 * Central brand / site configuration.
 * Change contact details, social links and pricing behaviour here.
 */
export const SITE_CONFIG = {
  brandName: 'CeroLeather',
  tagline: 'Handmade. Custom. Built for the road.',
  statement:
    'Ručno izrađeni kožni prsluci i jakne. Kreirani po vašoj meri — za vožnju, za put, za vas.',
  contactEmail: environment.emailjs.toEmail, // TODO: confirm public contact email
  instagramUrl: 'https://www.instagram.com/', // TODO: real Instagram profile URL
  instagramHandle: '@ceroleather', // TODO: confirm handle

  /** Prices are optional. Set to true and fill `price` on products to show them. */
  showPrices: false,
  currency: 'RSD',
} as const;
