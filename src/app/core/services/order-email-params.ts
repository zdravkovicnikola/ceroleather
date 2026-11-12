import { environment } from '../../../environments/environment';
import { MEASUREMENTS } from '../../data/measurements.data';
import { findProduct } from '../../data/products.data';
import { OrderRequest } from '../../models/order-request.model';

/**
 * SINGLE SOURCE OF TRUTH for the EmailJS template variables.
 * ----------------------------------------------------------
 * Every name here must match a {{variable}} in docs/emailjs-template.html (and the table in
 * docs/emailjs-field-mapping.md). `npm run check:emailjs` verifies the three stay in sync.
 *
 * All values are display-ready Serbian strings: units are included and empty optional fields
 * get a clear text ("Nije uneto"), so the email never shows blank or "undefined" values.
 * The only intentionally empty values are `designImageUrl` and `product_url`, which drive the
 * {{#…}}…{{/…}} conditional blocks of the template.
 */
export const ORDER_EMAIL_PARAMS = [
  // email settings
  'subject',
  'reply_to',
  // request
  'request_type',
  'submitted_at',
  // customer
  'customer_name',
  'first_name',
  'last_name',
  'email',
  'phone',
  'address_street',
  'address_postal_code',
  'address_city',
  'address_full',
  // model
  'product_name',
  'product_slug',
  'product_category',
  'product_url',
  // measurements (names come from MEASUREMENTS[].emailParam)
  'vest_length_cm',
  'waist_cm',
  'abdomen_cm',
  'height_cm',
  'measurements_summary',
  // wishes
  'customization',
  'message',
  // reference photo (Cloudinary secure_url, '' when none)
  'designImageUrl',
  // confirmations
  'advance_acknowledged',
  'privacy_consent',
  // plain-text version of everything (alternative template body)
  'order_summary',
] as const;

export type OrderEmailParam = (typeof ORDER_EMAIL_PARAMS)[number];
export type OrderEmailParams = Record<OrderEmailParam, string>;

const NOT_ENTERED = 'Nije uneto';

/** "98,5 cm" / null → null */
function cm(v: number | null | undefined): string | null {
  return v == null ? null : `${String(v).replace('.', ',')} cm`;
}

function measurementText(id: string, r: OrderRequest): string {
  const def = MEASUREMENTS.find((m) => m.id === id);
  const v = cm(r.measurements[id]);
  if (!v) return `${NOT_ENTERED}${def && !def.required ? ' (opciono)' : ''}`;
  return def?.approximate ? `${v} (okvirno)` : v;
}

/** From the explicit form mode — never guessed from the product field. */
function requestType(r: OrderRequest): string {
  return r.requestMode === 'catalog' ? 'Model iz kataloga' : 'Sopstvena ideja (custom dizajn)';
}

/**
 * Human-readable plain-text version of the whole request. Used as {{order_summary}} and for
 * "Kopiraj moje podatke" when sending fails.
 */
export function orderSummaryText(r: OrderRequest, submittedAt = new Date()): string {
  const lines = [
    'ZAHTEV ZA PORUDŽBINU — CeroLeather',
    `Poslato: ${submittedAt.toLocaleString('sr-Latn-RS')}`,
    'Status: čeka potvrdu i dogovor o avansu (nije plaćeno)',
    `Vrsta zahteva: ${requestType(r)}`,
    '',
    'KUPAC',
    `Ime i prezime: ${r.firstName} ${r.lastName}`,
    `Telefon: ${r.phone}`,
    `Email: ${r.email}`,
    `Adresa: ${r.address.street}, ${r.address.postalCode} ${r.address.city}`,
    '',
    'MODEL',
    `Model: ${r.productName}`,
    `Kategorija: ${r.categoryLabel}`,
    '',
    'MERE',
    ...MEASUREMENTS.map((m) => `${m.label}: ${measurementText(m.id, r)}`),
    '',
    'ŽELJE',
    `Dodatni zahtevi za prilagođavanje: ${r.customization || NOT_ENTERED}`,
    `Poruka: ${r.message || NOT_ENTERED}`,
    `Referentna fotografija: ${r.designImageUrl || 'nije priložena'}`,
    '',
    `Kupac je potvrdio da razume da je avans obavezan: ${r.advanceAcknowledged ? 'Da' : 'Ne'}`,
    `Saglasnost za obradu podataka: ${r.privacyConsent ? 'Da' : 'Ne'}`,
  ];
  return lines.join('\n');
}

/** Maps a request to the EmailJS template variables (see ORDER_EMAIL_PARAMS). */
export function toTemplateParams(r: OrderRequest, now = new Date()): OrderEmailParams {
  const fullName = `${r.firstName} ${r.lastName}`.trim();
  // a catalog product only counts in catalog mode (custom requests never carry one)
  const product = r.requestMode === 'catalog' ? findProduct(r.productSlug) : undefined;

  const measurementParams = Object.fromEntries(
    MEASUREMENTS.map((m) => [m.emailParam, measurementText(m.id, r)]),
  ) as Record<'vest_length_cm' | 'waist_cm' | 'abdomen_cm' | 'height_cm', string>;

  return {
    subject: product
      ? `Novi zahtev za model ${product.name} — ${fullName}`
      : `Novi zahtev za custom dizajn — ${fullName}`,
    reply_to: r.email,
    request_type: requestType(r),
    submitted_at: now.toLocaleString('sr-Latn-RS'),

    customer_name: fullName,
    first_name: r.firstName,
    last_name: r.lastName,
    email: r.email,
    phone: r.phone,
    address_street: r.address.street,
    address_postal_code: r.address.postalCode,
    address_city: r.address.city,
    address_full: `${r.address.street}, ${r.address.postalCode} ${r.address.city}`,

    product_name: r.productName,
    product_slug: r.productSlug,
    product_category: r.categoryLabel,
    // '' for a custom idea → the "Pogledaj model na sajtu" link is omitted
    product_url: product ? `${environment.siteUrl}/katalog/${product.slug}` : '',

    ...measurementParams,
    measurements_summary: MEASUREMENTS.map((m) => `${m.label}: ${measurementText(m.id, r)}`).join(
      '\n',
    ),

    customization: r.customization || 'Nema dodatnih zahteva',
    message: r.message || 'Kupac nije ostavio poruku',

    // Cloudinary secure_url — never a file or base64. '' hides the photo section.
    designImageUrl: r.designImageUrl || '',

    advance_acknowledged: r.advanceAcknowledged ? 'Da — kupac razume da je avans obavezan' : 'Ne',
    privacy_consent: r.privacyConsent ? 'Da — saglasnost data' : 'Ne',

    order_summary: orderSummaryText(r, now),
  };
}
