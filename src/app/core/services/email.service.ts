import { Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';
import { MEASUREMENTS } from '../../data/measurements.data';
import { findProduct } from '../../data/products.data';
import { OrderRequest } from '../../models/order-request.model';

export class EmailConfigError extends Error {
  constructor() {
    super('EmailJS nije konfigurisan (serviceId / templateId / publicKey).');
    this.name = 'EmailConfigError';
  }
}

export class EmailDeliveryError extends Error {
  constructor(
    message: string,
    readonly status?: number,
  ) {
    super(message);
    this.name = 'EmailDeliveryError';
  }
}

/**
 * EmailJS integration — the only external service of the site (no own backend).
 * UI components never talk to EmailJS directly; they call `sendOrderRequest`.
 *
 * Security notes
 * - Only the EmailJS *public* key is used here; it is public by design. The private key,
 *   SMTP / Gmail credentials and the recipient address live in the EmailJS dashboard only.
 * - The recipient is NOT sent from the browser: set "To Email" in the EmailJS template
 *   (see README → EmailJS), so nobody can abuse the form to mail other addresses.
 *
 * The promise resolves ONLY after EmailJS confirms delivery (HTTP 200).
 */
@Injectable({ providedIn: 'root' })
export class EmailService {
  private readonly config = environment.emailjs;

  get isConfigured(): boolean {
    return !!(this.config.serviceId && this.config.templateId && this.config.publicKey);
  }

  async sendOrderRequest(request: OrderRequest): Promise<void> {
    if (!this.isConfigured) throw new EmailConfigError();

    // Lazy-load the SDK so it isn't part of the initial bundle.
    const emailjs = (await import('@emailjs/browser')).default;

    try {
      const res = await emailjs.send(
        this.config.serviceId,
        this.config.templateId,
        toTemplateParams(request),
        {
          publicKey: this.config.publicKey,
          limitRate: { id: 'ceroleather-order', throttle: 10_000 },
        },
      );
      if (res.status !== 200)
        throw new EmailDeliveryError(res.text || 'Neočekivan odgovor servera.', res.status);
    } catch (err: unknown) {
      if (err instanceof EmailDeliveryError) throw err;
      const e = err as { status?: number; text?: string; message?: string };
      throw new EmailDeliveryError(e?.text || e?.message || 'Slanje nije uspelo.', e?.status);
    }
  }
}

/** Measurement value as text, e.g. "98,5 cm" / "—" */
function cm(v: number | null | undefined): string {
  return v == null ? '—' : `${String(v).replace('.', ',')} cm`;
}

/**
 * Human-readable plain-text version of the whole request. Used in the email
 * ({{order_summary}}) and for "copy my data" when sending fails.
 */
export function orderSummaryText(r: OrderRequest, submittedAt = new Date()): string {
  const lines = [
    'ZAHTEV ZA PORUDŽBINU — CeroLeather',
    `Poslato: ${submittedAt.toLocaleString('sr-Latn-RS')}`,
    'Status: čeka potvrdu i dogovor o avansu (nije plaćeno)',
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
    ...MEASUREMENTS.map(
      (m) =>
        `${m.label}${m.approximate ? ' (okvirno)' : ''}: ${cm(r.measurements[m.id])}${!m.required && r.measurements[m.id] == null ? ' (nije uneto)' : ''}`,
    ),
    '',
    'ŽELJE',
    `Prilagođavanje: ${r.customization || '—'}`,
    `Poruka: ${r.message || '—'}`,
    '',
    `Kupac je potvrdio da razume da je avans obavezan: ${r.advanceAcknowledged ? 'DA' : 'NE'}`,
    `Saglasnost za obradu podataka: ${r.privacyConsent ? 'DA' : 'NE'}`,
  ];
  return lines.join('\n');
}

/** Maps the request to EmailJS template variables. Keep in sync with the template (README). */
export function toTemplateParams(r: OrderRequest): Record<string, string> {
  const now = new Date();
  const fullName = `${r.firstName} ${r.lastName}`.trim();
  const params: Record<string, string> = {
    subject: `Novi zahtev za porudžbinu — ${r.productName} — ${fullName}`,
    first_name: r.firstName,
    last_name: r.lastName,
    from_name: fullName,
    reply_to: r.email,
    email: r.email,
    phone: r.phone,
    address_street: r.address.street,
    address_city: r.address.city,
    address_postal_code: r.address.postalCode,
    address_full: `${r.address.street}, ${r.address.postalCode} ${r.address.city}`,
    product_name: r.productName,
    product_slug: r.productSlug,
    product_category: r.categoryLabel,
    product_url: findProduct(r.productSlug)
      ? `${environment.siteUrl}/katalog/${r.productSlug}`
      : '— (sopstvena ideja)',
    customization: r.customization || '—',
    message: r.message || '—',
    advance_acknowledged: r.advanceAcknowledged ? 'DA' : 'NE',
    privacy_consent: r.privacyConsent ? 'DA' : 'NE',
    submitted_at: now.toLocaleString('sr-Latn-RS'),
  };
  const summary: string[] = [];
  for (const m of MEASUREMENTS) {
    const v = r.measurements[m.id];
    params[m.emailParam] = v == null ? '—' : String(v).replace('.', ',');
    summary.push(`${m.label}${m.approximate ? ' (okvirno)' : ''}: ${cm(v)}`);
  }
  params['measurements_summary'] = summary.join('\n');
  params['order_summary'] = orderSummaryText(r, now);
  return params;
}
