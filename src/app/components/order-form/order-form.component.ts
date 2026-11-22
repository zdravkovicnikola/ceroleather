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
  CloudinaryUploadError,
  CloudinaryUploadService,
} from '../../core/services/cloudinary-upload.service';
import {
  EmailConfigError,
  EmailDeliveryError,
  EmailService,
  orderSummaryText,
} from '../../core/services/email.service';
import { OrderStateService } from '../../core/services/order-state.service';
import { CATEGORIES, categoryLabel } from '../../data/categories.data';
import { MEASUREMENTS } from '../../data/measurements.data';
import { PRODUCTS, findProduct } from '../../data/products.data';
import { MeasurementDefinition, MeasurementValues } from '../../models/measurement.model';
import { OrderMode, OrderRequest, SubmitState } from '../../models/order-request.model';
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

/** Friendly Serbian text for an EmailJS failure (details go to the console in dev mode). */
function emailErrorText(err: unknown): string {
  if (err instanceof EmailConfigError)
    return 'Slanje zahteva trenutno nije podešeno na ovom sajtu.';
  if (err instanceof EmailDeliveryError)
    switch (err.kind) {
      case 'network':
        return 'Zahtev nije poslat — nema internet konekcije ili server nije dostupan. Proverite konekciju i pokušajte ponovo.';
      case 'rate-limit':
        return 'Zahtev nije poslat jer je slanje pokušano prebrzo. Sačekajte nekoliko sekundi i pokušajte ponovo.';
      case 'rejected':
        return 'Zahtev nije poslat zbog greške u podešavanju slanja na sajtu. Pokušajte kasnije ili nam se javite direktno.';
      default:
        return 'Servis za slanje je trenutno nedostupan. Pokušajte ponovo za nekoliko minuta.';
    }
  return 'Zahtev nije poslat. Pokušajte ponovo.';
}

/** Friendly Serbian text for a Cloudinary failure. */
function uploadErrorText(err: unknown): string {
  if (err instanceof CloudinaryConfigError)
    return 'Slanje fotografija trenutno nije podešeno na ovom sajtu.';
  if (err instanceof CloudinaryUploadError)
    switch (err.kind) {
      case 'network':
        return 'Fotografija nije otpremljena — nema internet konekcije ili je veza prespora. Pokušajte ponovo.';
      case 'invalid':
        return 'Fotografija nije prihvaćena (JPG, JPEG, PNG ili WEBP, najviše 5 MB).';
      case 'rejected':
        return 'Fotografija nije otpremljena zbog greške u podešavanju sajta. Uklonite je i pošaljite zahtev bez nje, ili pokušajte kasnije.';
      default:
        return 'Servis za fotografije je trenutno nedostupan. Pokušajte ponovo ili pošaljite zahtev bez fotografije.';
    }
  return 'Fotografija nije otpremljena. Pokušajte ponovo.';
}

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
  /**
   * EXPLICIT inquiry flow, decided by the hosting page (?zahtev=custom|katalog, product page):
   *  - 'custom'  → new design: "Model" section hidden, inspiration photo upload shown
   *  - 'catalog' → existing model: "Model" section shown (pre-filled), no photo upload
   */
  readonly mode = input<OrderMode>('custom');
  /** Catalog flow: pre-selected product slug (?proizvod= or the product page) */
  readonly presetSlug = input<string | null | undefined>(null);
  /** Custom flow: optional category hint (?kategorija=<category id>) */
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
  readonly selectedProduct = computed(() =>
    this.mode() === 'catalog' ? findProduct(this.productSlug()) : undefined,
  );
  readonly isCustom = computed(() => this.mode() === 'custom');
  /** Section numbers — the custom flow has no "Model" section, so the others move up. */
  readonly sectionNo = computed(() => {
    const keys = this.isCustom()
      ? ['customer', 'measurements', 'wishes', 'confirm']
      : ['customer', 'model', 'measurements', 'wishes', 'confirm'];
    return Object.fromEntries(keys.map((k, i) => [k, String(i + 1).padStart(2, '0')])) as Record<
      string,
      string
    >;
  });

  constructor() {
    const destroyRef = inject(DestroyRef);

    // Mode + presets → the model fields. Re-runs when the visitor follows another link to
    // the same page (the component is reused), so nothing from the previous flow survives.
    effect(() => {
      const mode = this.mode();
      const slug = this.presetSlug();
      const cat = this.presetCategory();
      untracked(() => this.applyMode(mode, slug, cat));
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

    // 1) Optional photo → Cloudinary — custom flow only (skipped when there is none, or it is
    //    already uploaded). Catalog requests never upload anything.
    let designImageUrl = '';
    const file = this.isCustom() ? this.designFile() : null;
    const up = this.uploadedDesign();
    if (this.isCustom() && up && up.file === file) {
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
        this.fail('upload', uploadErrorText(err));
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
      this.fail('email', emailErrorText(err));
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
    this.applyMode(this.mode(), this.presetSlug(), this.presetCategory());
  }

  discardDraft(): void {
    this.clearDraft();
    this.reset();
  }

  // ---------------------------------------------------------------------------

  /** Puts the model fields (and the photo) into the state the flow requires. */
  private applyMode(
    mode: OrderMode,
    slug: string | null | undefined,
    cat: string | null | undefined,
  ): void {
    const product = this.form.controls.productSlug;
    const category = this.form.controls.category;
    if (mode === 'catalog') {
      // catalog: a real product (pre-filled when the link carries one), never "custom idea"
      product.setValue(slug && findProduct(slug) ? slug : '');
      if (!product.value) {
        category.enable({ emitEvent: false });
        category.setValue('');
      }
      // a photo picked in the custom flow must not travel into a catalog request
      this.designFile.set(null);
      this.uploadedDesign.set(null);
    } else {
      product.setValue(CUSTOM_IDEA);
      category.enable({ emitEvent: false });
      category.setValue(
        cat && CATEGORIES.some((c) => c.id === cat) ? (cat as ProductCategoryId) : 'custom',
      );
      this.state.selectedProductSlug.set(null);
    }
  }

  private buildRequest(designImageUrl: string): OrderRequest {
    const raw = this.form.getRawValue();
    const mode = this.mode();
    const product = mode === 'catalog' ? findProduct(raw.productSlug) : undefined;
    const measurements: MeasurementValues = Object.fromEntries(
      MEASUREMENTS.map((m) => [m.id, toNumber(raw.measurements[m.id])]),
    );
    return {
      requestMode: mode,
      firstName: raw.firstName.trim(),
      lastName: raw.lastName.trim(),
      email: raw.email.trim(),
      phone: raw.phone.trim(),
      address: {
        street: raw.street.trim(),
        city: raw.city.trim(),
        postalCode: raw.postalCode.trim(),
      },
      productSlug: product ? product.slug : CUSTOM_IDEA,
      productName: product?.name ?? 'Sopstvena ideja (custom)',
      categoryLabel: raw.category ? categoryLabel(raw.category) : '—',
      measurements,
      customization: raw.customization.trim(),
      message: raw.message.trim(),
      advanceAcknowledged: raw.advanceAck,
      privacyConsent: raw.privacyConsent,
      designImageUrl: mode === 'custom' ? designImageUrl : '',
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

    // The flow (link) decides the model fields — a draft from another flow must not leak in.
    // Only a catalog visit without a product in the link may restore the product chosen earlier.
    const patch: Record<string, unknown> = { ...draft.data };
    const draftSlug = String(patch['productSlug'] ?? '');
    delete patch['productSlug'];
    delete patch['category'];
    this.form.patchValue(patch);
    if (
      this.mode() === 'catalog' &&
      !this.form.controls.productSlug.value &&
      findProduct(draftSlug)
    )
      this.form.controls.productSlug.setValue(draftSlug);
    // push restored measurements to the guide as well
    for (const m of MEASUREMENTS)
      this.state.setMeasurement(m.id, toNumber(this.measurementGroup.controls[m.id].value));
    // a photo uploaded before the failed send is reused, not uploaded again
    const d = draft.design;
    if (this.isCustom() && d?.url?.startsWith('https://res.cloudinary.com/'))
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
