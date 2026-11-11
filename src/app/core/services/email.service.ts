import { Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';
import { OrderRequest } from '../../models/order-request.model';
import { toTemplateParams } from './order-email-params';

// The parameter mapping lives in ./order-email-params.ts (single source of truth).
export { orderSummaryText, toTemplateParams } from './order-email-params';

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
