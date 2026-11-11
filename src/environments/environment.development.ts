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
};
