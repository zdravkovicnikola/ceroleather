/**
 * Development environment (used by `ng serve`).
 * Fill these in with your EmailJS test credentials to test real delivery locally.
 */
export const environment = {
  production: false,
  siteUrl: 'http://localhost:4200',
  emailjs: {
    serviceId: '',
    templateId: '',
    publicKey: '',
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
