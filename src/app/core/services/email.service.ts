import { Injectable, isDevMode } from '@angular/core';
import { environment } from '../../../environments/environment';
import { OrderRequest } from '../../models/order-request.model';
import { toTemplateParams } from './order-email-params';

// The parameter mapping lives in ./order-email-params.ts (single source of truth).
export { orderSummaryText, toTemplateParams } from './order-email-params';

/** The three values EmailJS needs — names as they appear in src/environments/environment*.ts */
export type EmailConfigKey = 'serviceId' | 'templateId' | 'publicKey';

/** Thrown BEFORE any request when one or more EmailJS values are empty. */
export class EmailConfigError extends Error {
  constructor(readonly missing: EmailConfigKey[]) {
    super(`EmailJS nije konfigurisan — nedostaje: ${missing.join(', ')}`);
    this.name = 'EmailConfigError';
  }
}

/**
 * What went wrong while sending:
 *  - network     → no connection / request never reached EmailJS
 *  - rejected    → EmailJS refused the request (4xx: wrong service/template ID or public key,
 *                  domain not in "Allowed origins", template error, account limit)
 *  - rate-limit  → too many sends in a short time (client throttle or EmailJS 429)
 *  - unavailable → EmailJS / the email provider failed (5xx or unexpected answer)
 */
export type EmailFailureKind = 'network' | 'rejected' | 'rate-limit' | 'unavailable';

export class EmailDeliveryError extends Error {
  constructor(
    message: string,
    readonly kind: EmailFailureKind,
    readonly status?: number,
  ) {
    super(message);
    this.name = 'EmailDeliveryError';
  }
}

function classify(status: number | undefined): EmailFailureKind {
  if (!status) return 'network';
  if (status === 429) return 'rate-limit';
  if (status >= 400 && status < 500) return 'rejected';
  return 'unavailable';
}

/**
 * EmailJS integration — the only external service of the site (no own backend).
 * UI components never talk to EmailJS directly; they call `sendOrderRequest`.
 *
 * Security notes
 * - Only the EmailJS *public* key is used here; it is public by design. The private key,
 *   SMTP / Gmail credentials and the recipient address live in the EmailJS dashboard only.
 * - The recipient is NOT sent from the browser: set "To Email" in the EmailJS template
 *   (nzdravkovic2001@gmail.com), so nobody can abuse the form to mail other addresses.
 *   The customer's address is sent as {{reply_to}} only.
 *
 * Diagnostics: in development (`ng serve`) the exact cause is logged to the console — which
 * value is missing, or EmailJS's status/answer. Values themselves are never printed.
 * In production visitors only see a friendly Serbian message.
 *
 * The promise resolves ONLY after EmailJS confirms delivery (HTTP 200).
 */
@Injectable({ providedIn: 'root' })
export class EmailService {
  private readonly config = environment.emailjs;

  constructor() {
    const missing = this.missingConfig();
    if (missing.length && isDevMode())
      console.warn(
        `[CeroLeather] EmailJS nije podešen — prazno u src/environments/environment*.ts → emailjs: ${missing.join(', ')}. ` +
          'Forma neće slati zahteve dok se ove vrednosti ne upišu (vidi docs/emailjs-template-setup.md).',
      );
  }

  /** Names of the EmailJS values that are still empty (never their contents). */
  missingConfig(): EmailConfigKey[] {
    return (['serviceId', 'templateId', 'publicKey'] as const).filter(
      (k) => !String(this.config[k] ?? '').trim(),
    );
  }

  get isConfigured(): boolean {
    return this.missingConfig().length === 0;
  }

  async sendOrderRequest(request: OrderRequest): Promise<void> {
    const missing = this.missingConfig();
    if (missing.length) {
      const err = new EmailConfigError(missing);
      this.debug('konfiguracija', err.message);
      throw err;
    }

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
        throw new EmailDeliveryError(
          res.text || 'Neočekivan odgovor servera.',
          classify(res.status),
          res.status,
        );
    } catch (err: unknown) {
      const e =
        err instanceof EmailDeliveryError
          ? err
          : (() => {
              const x = err as { status?: number; text?: string; message?: string };
              return new EmailDeliveryError(
                x?.text || x?.message || 'Slanje nije uspelo.',
                classify(x?.status),
                x?.status,
              );
            })();
      this.debug(
        e.kind === 'network' ? 'mreža' : `EmailJS (${e.kind})`,
        `status ${e.status ?? '—'}: ${e.message}`,
        e.kind === 'rejected'
          ? 'Proverite Service ID / Template ID / Public Key i Account → Security → Allowed origins.'
          : undefined,
      );
      throw e;
    }
  }

  /** Development-only console diagnostics (no credentials are ever printed). */
  private debug(scope: string, detail: string, hint?: string): void {
    if (!isDevMode()) return;
    console.error(`[CeroLeather] Slanje emaila nije uspelo — ${scope}: ${detail}`);
    if (hint) console.info(`[CeroLeather] ${hint}`);
  }
}
