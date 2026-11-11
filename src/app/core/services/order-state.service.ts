import { Injectable, signal } from '@angular/core';
import { MeasurementValues } from '../../models/measurement.model';

/**
 * Shared, in-memory state between the measurement guide and the order form.
 * Values entered in the guide automatically appear in the form and vice versa.
 */
@Injectable({ providedIn: 'root' })
export class OrderStateService {
  readonly selectedProductSlug = signal<string | null>(null);
  readonly measurements = signal<MeasurementValues>({});

  setMeasurement(id: string, value: number | null): void {
    if (this.measurements()[id] === value) return;
    this.measurements.update((m) => ({ ...m, [id]: value }));
  }

  reset(): void {
    this.measurements.set({});
  }
}
