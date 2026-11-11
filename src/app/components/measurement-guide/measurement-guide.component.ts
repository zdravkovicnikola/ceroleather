import { ChangeDetectionStrategy, Component, computed, inject, input, output, signal } from '@angular/core';
import { OrderStateService } from '../../core/services/order-state.service';
import { measurementsFor } from '../../data/measurements.data';
import { MeasurementDefinition } from '../../models/measurement.model';
import { MeasurementStepComponent, measurementError } from './measurement-step.component';
import { MeasurementViewer3dComponent } from './measurement-viewer-3d.component';

/**
 * UNIVERSAL measurement guide — renders whatever MEASUREMENTS are configured
 * (optionally filtered per product). Values are shared with the order form
 * through OrderStateService.
 */
@Component({
  selector: 'app-measurement-guide',
  imports: [MeasurementViewer3dComponent, MeasurementStepComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './measurement-guide.component.html',
  styleUrl: './measurement-guide.component.scss',
})
export class MeasurementGuideComponent {
  /** Product-specific subset; empty = all measurements */
  readonly measurementIds = input<string[] | undefined>(undefined);
  readonly proceed = output<void>();

  private readonly state = inject(OrderStateService);

  readonly definitions = computed<MeasurementDefinition[]>(() => measurementsFor(this.measurementIds()));
  readonly index = signal(0);
  readonly showSummary = signal(false);

  readonly active = computed(() => this.definitions()[Math.min(this.index(), this.definitions().length - 1)]);
  readonly values = this.state.measurements;
  readonly activeValue = computed(() => this.values()[this.active().id] ?? null);

  readonly completed = computed(() =>
    this.definitions().map((d) => {
      const v = this.values()[d.id];
      return v != null && !measurementError(d, v);
    }),
  );
  readonly completedCount = computed(() => this.completed().filter(Boolean).length);
  readonly allDone = computed(() => this.completedCount() === this.definitions().length);

  go(i: number): void {
    this.showSummary.set(false);
    this.index.set(Math.max(0, Math.min(this.definitions().length - 1, i)));
  }

  next(): void {
    if (this.index() < this.definitions().length - 1) this.go(this.index() + 1);
    else this.showSummary.set(true);
  }

  prev(): void {
    if (this.showSummary()) this.showSummary.set(false);
    else this.go(this.index() - 1);
  }

  setValue(id: string, v: number | null): void {
    this.state.setMeasurement(id, v);
  }

  valueOf(id: string): number | null {
    return this.values()[id] ?? null;
  }
}
