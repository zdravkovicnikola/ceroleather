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
  siteUrl: 'https://ceroleather.rs', // official domain (canonical, sitemap, OG, email links)
  /**
   * EmailJS — REQUIRED for the order form to send anything. While any of these is empty the form
   * shows "Slanje zahteva trenutno nije podešeno…" (and, in dev, logs which one is missing).
   * Copy them from https://dashboard.emailjs.com (they are public by design — not secrets):
   *  - serviceId  → Email Services → your connected service (e.g. Gmail) → "Service ID"
   *  - templateId → Email Templates → the CeroLeather template → Settings → "Template ID"
   *  - publicKey  → Account → General → "Public Key"
   * The RECIPIENT (nzdravkovic2001@gmail.com) is NOT set here but in the template's "To Email";
   * the customer's address arrives as {{reply_to}}. See docs/emailjs-template-setup.md.
   */
  emailjs: {
    serviceId: 'service_1qmjfck', // service_xxxxxxx
    templateId: 'template_5fr6gcn', // template_xxxxxxx
    publicKey: 'DJNOylVmohloyqXxW', // e.g. AbCdEfGhIjKlMnOpQ
  },
  /**
   * Cloudinary — customer inspiration photos (unsigned upload, no API secret anywhere).
   * Both values are public by design. The target folder, allowed formats and max size are set
   * on the upload preset in the Cloudinary dashboard (Settings → Upload → Upload presets).
   */
  cloudinary: {
    cloudName: 'irge9ucn',
    uploadPreset: 'ceroleather_custom_requests', // must be an UNSIGNED preset
  },
};
