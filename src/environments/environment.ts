/**
 * Production environment.
 *
 * EmailJS keys are public by design (they are used directly in the browser).
 * Protect your EmailJS account with "Allowed origins" / domain restrictions
 * in the EmailJS dashboard (Account → Security).
 *
 * See README.md → "EmailJS konfiguracija".
 */
export const environment = {
  production: true,
  siteUrl: 'https://www.ceroleather.com', // TODO: real production domain
  emailjs: {
    serviceId: '', // e.g. 'service_xxxxxxx'
    templateId: '', // e.g. 'template_xxxxxxx'
    publicKey: '', // e.g. 'AbCdEfGhIjKlMnOpQ'
    /** Destination inbox. Used by the template's "To Email" field via {{to_email}}. */
    toEmail: 'kontakt@ceroleather.com', // TODO: real workshop inbox
  },
};
