import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  computed,
  effect,
  inject,
  input,
  signal,
  untracked,
} from '@angular/core';
import { AbstractControl, FormControl, FormGroup, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { toSignal } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { SITE_CONFIG } from '../../core/config/site.config';
import { EmailConfigError, EmailService } from '../../core/services/email.service';
import { OrderStateService } from '../../core/services/order-state.service';
import { CATEGORIES, categoryLabel } from '../../data/categories.data';
import { MEASUREMENTS } from '../../data/measurements.data';
import { PRODUCTS, findProduct } from '../../data/products.data';
import { MeasurementDefinition } from '../../models/measurement.model';
import { SubmitState } from '../../models/order-request.model';
import { ProductCategoryId } from '../../models/product.model';

/** Value used in the product select for a fully custom idea */
export const CUSTOM_IDEA = 'sopstvena-ideja';

const PHONE_PATTERN = /^\+?[0-9\s\-()/]{6,20}$/;

function rangeValidator(def: MeasurementDefinition) {
  return (c: AbstractControl): ValidationErrors | null => {
    const raw = c.value;
    if (raw === null || raw === '' || raw === undefined) return null;
    const n = Number(String(raw).replace(',', '.'));
    if (Number.isNaN(n)) return { number: true };
    return n < def.min || n > def.max ? { range: { min: def.min, max: def.max } } : null;
  };
}

@Component({
  selector: 'app-order-form',
  imports: [ReactiveFormsModule, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './order-form.component.html',
  styleUrl: './order-form.component.scss',
})
export class OrderFormComponent {
  /** Pre-selected product slug (from the product page or ?proizvod=) */
  readonly presetSlug = input<string | null | undefined>(null);
  /** Pre-selected category (from ?kategorija=) when no product is given */
  readonly presetCategory = input<string | null | undefined>(null);
  /** Hide the product picker when the form sits on a product page */
  readonly compact = input(false);

  private readonly email = inject(EmailService);
  private readonly state = inject(OrderStateService);
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;

  readonly products = PRODUCTS;
  readonly categories = CATEGORIES;
  readonly measurements = MEASUREMENTS;
  readonly customIdea = CUSTOM_IDEA;
  readonly contactEmail = SITE_CONFIG.contactEmail;
  readonly categoryLabelFor = categoryLabel;

  readonly submitState = signal<SubmitState>('idle');
  readonly errorMessage = signal<string>('');
  readonly submitted = signal(false);

  readonly measurementGroup = new FormGroup<Record<string, FormControl<string | null>>>(
    Object.fromEntries(
      MEASUREMENTS.map((m) => [
        m.id,
        new FormControl<string | null>(null, m.required ? [Validators.required, rangeValidator(m)] : [rangeValidator(m)]),
      ]),
    ),
  );

  readonly form = new FormGroup({
    fullName: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.minLength(3)] }),
    email: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.email] }),
    phone: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.pattern(PHONE_PATTERN)] }),
    productSlug: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    category: new FormControl<ProductCategoryId | ''>('', { nonNullable: true, validators: [Validators.required] }),
    measurements: this.measurementGroup,
    customization: new FormControl('', { nonNullable: true, validators: [Validators.maxLength(2000)] }),
    message: new FormControl('', { nonNullable: true, validators: [Validators.maxLength(2000)] }),
    /** Honeypot — real users never see or fill this */
    website: new FormControl('', { nonNullable: true }),
  });

  private readonly productSlug = toSignal(this.form.controls.productSlug.valueChanges, { initialValue: '' });
  readonly selectedProduct = computed(() => findProduct(this.productSlug()));

  constructor() {
    const destroyRef = inject(DestroyRef);

    // Preset product / category
    effect(() => {
      const slug = this.presetSlug();
      const cat = this.presetCategory();
      untracked(() => {
        if (slug && findProduct(slug)) this.form.controls.productSlug.setValue(slug);
        else if (cat && CATEGORIES.some((c) => c.id === cat)) {
          this.form.controls.productSlug.setValue(CUSTOM_IDEA);
          this.form.controls.category.setValue(cat as ProductCategoryId);
        }
      });
    });

    // Category follows the product automatically (editable only for a custom idea)
    const productSub = this.form.controls.productSlug.valueChanges.subscribe((slug) => {
      const p = findProduct(slug);
      const cat = this.form.controls.category;
      if (p) {
        cat.setValue(p.category);
        cat.disable({ emitEvent: false });
        this.state.selectedProductSlug.set(p.slug);
      } else {
        cat.enable({ emitEvent: false });
        if (slug === CUSTOM_IDEA && !cat.value) cat.setValue('custom');
      }
    });

    // Measurement guide → form
    effect(() => {
      const values = this.state.measurements();
      untracked(() => {
        for (const m of MEASUREMENTS) {
          const v = values[m.id];
          const ctrl = this.measurementGroup.controls[m.id];
          const current = ctrl.value === null || ctrl.value === '' ? null : Number(String(ctrl.value).replace(',', '.'));
          if (v !== undefined && v !== current) ctrl.setValue(v == null ? null : String(v), { emitEvent: false });
        }
      });
    });

    // Form → measurement guide
    const mSub = this.measurementGroup.valueChanges.subscribe((vals) => {
      for (const m of MEASUREMENTS) {
        const raw = vals[m.id];
        const n = raw === null || raw === undefined || raw === '' ? null : Number(String(raw).replace(',', '.'));
        this.state.setMeasurement(m.id, n == null || Number.isNaN(n) ? null : n);
      }
    });

    destroyRef.onDestroy(() => {
      productSub.unsubscribe();
      mSub.unsubscribe();
    });
  }

  // ---------------------------------------------------------------------------

  showError(ctrl: AbstractControl): boolean {
    return ctrl.invalid && (ctrl.touched || this.submitted());
  }

  measurementControl(id: string): FormControl<string | null> {
    return this.measurementGroup.controls[id];
  }

  measurementErrorText(m: MeasurementDefinition): string {
    const c = this.measurementControl(m.id);
    if (c.hasError('required')) return 'Unesite meru u centimetrima.';
    if (c.hasError('number')) return 'Unesite broj (npr. 98 ili 98,5).';
    if (c.hasError('range')) return `Vrednost treba da bude između ${m.min} i ${m.max} cm.`;
    return '';
  }

  async submit(): Promise<void> {
    this.submitted.set(true);
    this.form.markAllAsTouched();
    if (this.submitState() === 'sending') return;

    if (this.form.invalid) {
      this.focusFirstInvalid();
      return;
    }
    // Bots fill the hidden field — pretend nothing happened, never send.
    if (this.form.controls.website.value) return;

    const raw = this.form.getRawValue();
    const product = findProduct(raw.productSlug);
    const measurements = Object.fromEntries(
      MEASUREMENTS.map((m) => {
        const v = raw.measurements[m.id];
        return [m.id, v === null || v === '' ? null : Number(String(v).replace(',', '.'))];
      }),
    );

    this.submitState.set('sending');
    this.errorMessage.set('');
    try {
      await this.email.sendOrderRequest({
        fullName: raw.fullName.trim(),
        email: raw.email.trim(),
        phone: raw.phone.trim(),
        productSlug: raw.productSlug,
        productName: product?.name ?? 'Sopstvena ideja (custom)',
        categoryLabel: raw.category ? categoryLabel(raw.category) : '—',
        measurements,
        customization: raw.customization.trim(),
        message: raw.message.trim(),
      });
      // Only now — after EmailJS confirmed delivery — show success.
      this.submitState.set('success');
      this.host.querySelector<HTMLElement>('.of__success')?.focus();
      setTimeout(() => this.host.querySelector<HTMLElement>('.of__success')?.focus(), 50);
    } catch (err) {
      this.submitState.set('error');
      this.errorMessage.set(
        err instanceof EmailConfigError
          ? 'Slanje upita trenutno nije podešeno na ovom sajtu.'
          : 'Došlo je do greške pri slanju. Proverite internet konekciju i pokušajte ponovo.',
      );
    }
  }

  reset(): void {
    this.form.reset();
    this.submitted.set(false);
    this.submitState.set('idle');
    this.state.reset();
    const slug = this.presetSlug();
    if (slug) this.form.controls.productSlug.setValue(slug);
  }

  private focusFirstInvalid(): void {
    setTimeout(() => {
      const el = this.host.querySelector<HTMLElement>('.is-invalid, [aria-invalid="true"]');
      el?.focus({ preventScroll: true });
      el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    });
  }
}
