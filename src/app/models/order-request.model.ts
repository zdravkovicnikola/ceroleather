import { MeasurementValues } from './measurement.model';

export interface OrderRequest {
  fullName: string;
  email: string;
  phone: string;
  productSlug: string;
  productName: string;
  categoryLabel: string;
  measurements: MeasurementValues;
  customization: string;
  message: string;
}

export type SubmitState = 'idle' | 'sending' | 'success' | 'error';
