import { Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';
import { MEASUREMENTS } from '../../data/measurements.data';
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
 * EmailJS integration — the only external service of the site.
 * UI components never talk to EmailJS directly; they call `sendOrderRequest`.
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
      const res = await emailjs.send(this.config.serviceId, this.config.templateId, this.toTemplateParams(request), {
        publicKey: this.config.publicKey,
        limitRate: { id: 'ceroleather-order', throttle: 10_000 },
      });
      if (res.status !== 200) throw new EmailDeliveryError(res.text || 'Neočekivan odgovor servera.', res.status);
    } catch (err: unknown) {
      if (err instanceof EmailDeliveryError) throw err;
      const e = err as { status?: number; text?: string; message?: string };
      throw new EmailDeliveryError(e?.text || e?.message || 'Slanje nije uspelo.', e?.status);
    }
  }

  /** Maps the request to EmailJS template variables. Keep in sync with the template (README). */
  private toTemplateParams(r: OrderRequest): Record<string, string> {
    const params: Record<string, string> = {
      to_email: this.config.toEmail,
      from_name: r.fullName,
      reply_to: r.email,
      email: r.email,
      phone: r.phone,
      product_name: r.productName,
      product_slug: r.productSlug,
      product_category: r.categoryLabel,
      product_url: `${environment.siteUrl}/katalog/${r.productSlug}`,
      customization: r.customization || '—',
      message: r.message || '—',
      submitted_at: new Date().toLocaleString('sr-Latn-RS'),
    };
    const summary: string[] = [];
    for (const m of MEASUREMENTS) {
      const v = r.measurements[m.id];
      const text = v == null ? '—' : `${v} ${m.unit}`;
      params[m.emailParam] = v == null ? '—' : String(v);
      summary.push(`${m.label}: ${text}`);
    }
    params['measurements_summary'] = summary.join('\n');
    return params;
  }
}
