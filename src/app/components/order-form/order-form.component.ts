import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  afterNextRender,
  computed,
  effect,
  inject,
  input,
  signal,
  untracked,
} from '@angular/core';
import {
  AbstractControl,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import { toSignal } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { SITE_CONFIG } from '../../core/config/site.config';
import {
  CloudinaryConfigError,
  CloudinaryUploadService,
} from '../../core/services/cloudinary-upload.service';
import {
  EmailConfigError,
  EmailService,
  orderSummaryText,
} from '../../core/services/email.service';
import { OrderStateService } from '../../core/services/order-state.service';
import { CATEGORIES, categoryLabel } from '../../data/categories.data';
import { MEASUREMENTS } from '../../data/measurements.data';
import { PRODUCTS, findProduct } from '../../data/products.data';
import { MeasurementDefinition, MeasurementValues } from '../../models/measurement.model';
import { OrderRequest, SubmitState } from '../../models/order-request.model';
import { ProductCategoryId } from '../../models/product.model';
import { InstagramIconComponent } from '../../shared/components/instagram-icon.component';
import { DesignUploadComponent } from '../design-upload/design-upload.component';

/** A photo already stored on Cloudinary, and the local file it came from (null after a reload). */
interface UploadedDesign {
  file: File | null;
  url: string;
  name: string;
}

/** Value used in the product select for a fully custom idea */
export const CUSTOM_IDEA = 'sopstvena-ideja';

/** Saved locally when sending fails, so the customer never has to retype everything. */
const DRAFT_KEY = 'ceroleather:order-draft';
const DRAFT_MAX_AGE_MS = 30 * 24 * 3600 * 1000;

const PHONE_CHARS = /^\+?[0-9\s\-()/]{6,24}$/;
/** Stricter than Validators.email: requires a domain with a TLD (a@b.rs) */
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
/** Serbian postal codes have 5 digits */
const POSTAL_PATTERN = /^\d{5}$/;

function phoneValidator(c: AbstractControl): ValidationErrors | null {
  const v = String(c.value ?? '').trim();
  if (!v) return null;
  const digits = v.replace(/\D/g, '').length;
  return PHONE_CHARS.test(v) && digits >= 8 && digits <= 15 ? null : { phone: true };
}

function rangeValidator(def: MeasurementDefinition) {
  return (c: AbstractControl): ValidationErrors | null => {
    const raw = c.value;
    if (raw === null || raw === '' || raw === undefined) return null;
    const n = Number(String(raw).replace(',', '.'));
    if (Number.isNaN(n)) return { number: true };
    return n < def.min || n > def.max ? { range: { min: def.min, max: def.max } } : null;
  };
}

const toNumber = (raw: string | null | undefined): number | null => {
  if (raw === null || raw === undefined || String(raw).trim() === '') return null;
  const n = Number(String(raw).replace(',', '.'));
  return Number.isNaN(n) ? null : n;
};

@Component({
  selector: 'app-order-form',
  imports: [ReactiveFormsModule, RouterLink, InstagramIconComponent, DesignUploadComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  // Values depend on query params, the guide and a locally saved draft → render on the client only.
  host: { ngSkipHydration: 'true' },
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
  private readonly cloudinary = inject(CloudinaryUploadService);
  private readonly state = inject(OrderStateService);
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;

  readonly products = PRODUCTS;
  readonly categories = CATEGORIES;
  readonly measurements = MEASUREMENTS;
  readonly customIdea = CUSTOM_IDEA;
  readonly contactEmail = SITE_CONFIG.contactEmail;
  readonly instagramUrl = SITE_CONFIG.instagramUrl;
  readonly instagramHandle = SITE_CONFIG.instagramHandle;
  readonly categoryLabelFor = categoryLabel;

  readonly submitState = signal<SubmitState>('idle');
  readonly errorMessage = signal<string>('');
  readonly submitted = signal(false);
  /** A draft from an earlier failed attempt was restored */
  readonly draftRestored = signal(false);
  readonly copyState = signal<'idle' | 'copied' | 'failed'>('idle');
  /** Plain-text copy of the last attempted request (shown if sending fails) */
  readonly fallbackText = signal('');

  // ── optional inspiration photo ────────────────────────────────────────────
  /** File the visitor selected (not uploaded until the form is submitted) */
  readonly designFile = signal<File | null>(null);
  /**
   * Result of a successful Cloudinary upload. Kept when EmailJS fails so a retry reuses the
   * same URL instead of uploading the photo again; dropped when the photo is replaced/removed.
   */
  readonly uploadedDesign = signal<UploadedDesign | null>(null);
  readonly uploadProgress = signal(0);
  readonly uploadPercent = computed(() => Math.round(this.uploadProgress() * 100));
  /** Which step failed last: the photo upload or the email */
  readonly failedStep = signal<'upload' | 'email' | null>(null);
  /** The photo currently shown in the picker is already on Cloudinary */
  readonly designIsUploaded = computed(() => {
    const up = this.uploadedDesign();
    return !!up && up.file === this.designFile();
  });
  readonly busy = computed(() => {
    const st = this.submitState();
    return st === 'uploading' || st === 'sending';
  });

  readonly measurementGroup = new FormGroup<Record<string, FormControl<string | null>>>(
    Object.fromEntries(
      MEASUREMENTS.map((m) => [
        m.id,
        new FormControl<string | null>(
          null,
          m.required ? [Validators.required, rangeValidator(m)] : [rangeValidator(m)],
        ),
      ]),
    ),
  );

  readonly form = new FormGroup({
    firstName: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.minLength(2), Validators.maxLength(60)],
    }),
    lastName: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.minLength(2), Validators.maxLength(60)],
    }),
    email: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.email, Validators.pattern(EMAIL_PATTERN)],
    }),
    phone: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, phoneValidator],
    }),
    street: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.minLength(3), Validators.maxLength(120)],
    }),
    city: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.minLength(2), Validators.maxLength(60)],
    }),
    postalCode: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.pattern(POSTAL_PATTERN)],
    }),
    productSlug: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    category: new FormControl<ProductCategoryId | ''>('', {
      nonNullable: true,
      validators: [Validators.required],
    }),
    measurements: this.measurementGroup,
    customization: new FormControl('', {
      nonNullable: true,
      validators: [Validators.maxLength(2000)],
    }),
    message: new FormControl('', { nonNullable: true, validators: [Validators.maxLength(2000)] }),
    advanceAck: new FormControl(false, {
      nonNullable: true,
      validators: [Validators.requiredTrue],
    }),
    privacyConsent: new FormControl(false, {
      nonNullable: true,
      validators: [Validators.requiredTrue],
    }),
    /** Honeypot — real users never see or fill this */
    website: new FormControl('', { nonNullable: true }),
  });

  private readonly productSlug = toSignal(this.form.controls.productSlug.valueChanges, {
    initialValue: '',
  });
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
          if (v !== undefined && v !== toNumber(ctrl.value))
            ctrl.setValue(v == null ? null : String(v), { emitEvent: false });
        }
      });
    });

    // Form → measurement guide
    const mSub = this.measurementGroup.valueChanges.subscribe((vals) => {
      for (const m of MEASUREMENTS) this.state.setMeasurement(m.id, toNumber(vals[m.id]));
    });

    destroyRef.onDestroy(() => {
      productSub.unsubscribe();
      mSub.unsubscribe();
    });

    // Replacing the photo invalidates the URL of the previously uploaded one.
    effect(() => {
      const file = this.designFile();
      untracked(() => {
        const up = this.uploadedDesign();
        if (up && up.file !== file) this.uploadedDesign.set(null);
      });
    });

    // Browser only: bring back data from an earlier attempt that could not be sent.
    afterNextRender(() => this.restoreDraft());
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

  emailErrorText(): string {
    return this.form.controls.email.hasError('required')
      ? 'Unesite email adresu.'
      : 'Email adresa nije ispravna (primer: ime@gmail.com).';
  }

  async submit(): Promise<void> {
    // One submission at a time (double clicks, Enter key while uploading…)
    if (this.busy()) return;
    this.submitted.set(true);
    this.form.markAllAsTouched();

    if (this.form.invalid) {
      this.focusFirstInvalid();
      return;
    }
    // Bots fill the hidden field — pretend nothing happened, never send.
    if (this.form.controls.website.value) return;

    this.fallbackText.set(orderSummaryText(this.buildRequest(this.uploadedDesign()?.url ?? '')));
    // Keep a local copy until delivery is confirmed — a failed send must never lose the data.
    this.saveDraft();
    this.errorMessage.set('');
    this.failedStep.set(null);
    this.copyState.set('idle');

    // 1) Optional photo → Cloudinary (skipped when there is none, or it is already uploaded)
    let designImageUrl = '';
    const file = this.designFile();
    const up = this.uploadedDesign();
    if (up && up.file === file) {
      designImageUrl = up.url;
    } else if (file) {
      this.submitState.set('uploading');
      this.uploadProgress.set(0);
      try {
        const res = await this.cloudinary.upload(file, (p) => this.uploadProgress.set(p));
        designImageUrl = res.secureUrl;
        this.uploadedDesign.set({ file, url: res.secureUrl, name: file.name });
        this.saveDraft(); // remember the URL too, in case the email step fails
      } catch (err) {
        this.fail(
          'upload',
          err instanceof CloudinaryConfigError
            ? 'Slanje fotografija trenutno nije podešeno na ovom sajtu.'
            : 'Fotografija nije otpremljena. Proverite internet konekciju i pokušajte ponovo.',
        );
        return;
      }
    }

    // 2) Request (with the photo URL, never the file itself) → EmailJS
    const request = this.buildRequest(designImageUrl);
    this.fallbackText.set(orderSummaryText(request));
    this.submitState.set('sending');
    try {
      await this.email.sendOrderRequest(request);
      // Only now — after EmailJS confirmed delivery — show success.
      this.clearDraft();
      this.submitState.set('success');
      setTimeout(() => {
        const el = this.host.querySelector<HTMLElement>('.of__success');
        el?.focus({ preventScroll: true });
        el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 50);
    } catch (err) {
      this.fail(
        'email',
        err instanceof EmailConfigError
          ? 'Slanje zahteva trenutno nije podešeno na ovom sajtu.'
          : 'Zahtev nije poslat. Proverite internet konekciju i pokušajte ponovo.',
      );
    }
  }

  /** Visitor removed the photo in the picker */
  onDesignRemoved(): void {
    this.uploadedDesign.set(null);
    if (this.failedStep() === 'upload') {
      this.failedStep.set(null);
      this.submitState.set('idle');
    }
    this.saveDraft();
  }

  private fail(step: 'upload' | 'email', message: string): void {
    this.failedStep.set(step);
    this.submitState.set('error');
    this.errorMessage.set(message);
    setTimeout(() =>
      this.host
        .querySelector<HTMLElement>('.of__alert--error')
        ?.scrollIntoView({ behavior: 'smooth', block: 'center' }),
    );
  }

  async copyFallback(): Promise<void> {
    try {
      await navigator.clipboard.writeText(this.fallbackText());
      this.copyState.set('copied');
    } catch {
      this.copyState.set('failed');
    }
  }

  reset(): void {
    this.form.reset();
    this.submitted.set(false);
    this.submitState.set('idle');
    this.draftRestored.set(false);
    this.designFile.set(null);
    this.uploadedDesign.set(null);
    this.uploadProgress.set(0);
    this.failedStep.set(null);
    this.state.reset();
    const slug = this.presetSlug();
    if (slug) this.form.controls.productSlug.setValue(slug);
  }

  discardDraft(): void {
    this.clearDraft();
    this.reset();
  }

  // ---------------------------------------------------------------------------

  private buildRequest(designImageUrl: string): OrderRequest {
    const raw = this.form.getRawValue();
    const product = findProduct(raw.productSlug);
    const measurements: MeasurementValues = Object.fromEntries(
      MEASUREMENTS.map((m) => [m.id, toNumber(raw.measurements[m.id])]),
    );
    return {
      firstName: raw.firstName.trim(),
      lastName: raw.lastName.trim(),
      email: raw.email.trim(),
      phone: raw.phone.trim(),
      address: {
        street: raw.street.trim(),
        city: raw.city.trim(),
        postalCode: raw.postalCode.trim(),
      },
      productSlug: raw.productSlug,
      productName: product?.name ?? 'Sopstvena ideja (custom)',
      categoryLabel: raw.category ? categoryLabel(raw.category) : '—',
      measurements,
      customization: raw.customization.trim(),
      message: raw.message.trim(),
      advanceAcknowledged: raw.advanceAck,
      privacyConsent: raw.privacyConsent,
      designImageUrl,
    };
  }

  private saveDraft(): void {
    try {
      const {
        website: _honeypot,
        advanceAck: _a,
        privacyConsent: _c,
        ...data
      } = this.form.getRawValue();
      // the photo itself cannot be stored locally — only the URL of an already uploaded one
      const up = this.uploadedDesign();
      const design = up ? { url: up.url, name: up.name } : null;
      localStorage.setItem(DRAFT_KEY, JSON.stringify({ savedAt: Date.now(), data, design }));
    } catch {
      /* storage unavailable (private mode) — the form itself still keeps the values */
    }
  }

  private clearDraft(): void {
    try {
      localStorage.removeItem(DRAFT_KEY);
    } catch {
      /* ignore */
    }
  }

  private restoreDraft(): void {
    let draft: {
      savedAt: number;
      data: Record<string, unknown>;
      design?: { url: string; name: string } | null;
    } | null = null;
    try {
      const raw = localStorage.getItem(DRAFT_KEY);
      draft = raw ? JSON.parse(raw) : null;
    } catch {
      return;
    }
    if (!draft?.data) return;
    if (Date.now() - draft.savedAt > DRAFT_MAX_AGE_MS) return this.clearDraft();

    const keepProduct = this.presetSlug() || this.presetCategory();
    const patch: Record<string, unknown> = { ...draft.data };
    if (keepProduct) {
      delete patch['productSlug'];
      delete patch['category'];
    }
    this.form.patchValue(patch);
    // push restored measurements to the guide as well
    for (const m of MEASUREMENTS)
      this.state.setMeasurement(m.id, toNumber(this.measurementGroup.controls[m.id].value));
    // a photo uploaded before the failed send is reused, not uploaded again
    const d = draft.design;
    if (d?.url?.startsWith('https://res.cloudinary.com/'))
      this.uploadedDesign.set({ file: null, url: d.url, name: d.name || '' });
    this.draftRestored.set(true);
  }

  private focusFirstInvalid(): void {
    setTimeout(() => {
      const el = this.host.querySelector<HTMLElement>('.is-invalid, [aria-invalid="true"]');
      el?.focus({ preventScroll: true });
      el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    });
  }
}
