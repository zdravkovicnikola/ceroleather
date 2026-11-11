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
    // The recipient is NOT configured here: set "To Email" in the EmailJS template
    // (currently the test inbox nzdravkovic2001@gmail.com). See README → EmailJS.
  },
  /**
   * Cloudinary — customer inspiration photos (unsigned upload, no API secret anywhere).
   * Both values are public by design. The target folder, allowed formats and max size are set
   * on the upload preset in the Cloudinary dashboard (Settings → Upload → Upload presets).
   */
  cloudinary: {
    cloudName: 'hzbtilhe',
    uploadPreset: 'ceroleather_custom_requests', // must be an UNSIGNED preset
  },
};
