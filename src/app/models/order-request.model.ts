import { MeasurementValues } from './measurement.model';

/** Customer delivery address (Serbia). */
export interface OrderAddress {
  street: string;
  city: string;
  postalCode: string;
}

/**
 * An ORDER REQUEST — not a confirmed purchase. The workshop calls the customer,
 * agrees the details and the mandatory advance payment; only then is the order confirmed.
 */
export interface OrderRequest {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: OrderAddress;
  productSlug: string;
  productName: string;
  categoryLabel: string;
  measurements: MeasurementValues;
  customization: string;
  message: string;
  /** Customer confirmed they understand the advance-payment process */
  advanceAcknowledged: boolean;
  /** Customer consented to the use of their data for processing the request */
  privacyConsent: boolean;
  /** Cloudinary secure_url of the optional inspiration photo (empty when none was attached) */
  designImageUrl: string;
}

/** uploading = photo → Cloudinary, sending = request → EmailJS */
export type SubmitState = 'idle' | 'uploading' | 'sending' | 'success' | 'error';
