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
    toEmail: 'kontakt@ceroleather.com',
  },
};
