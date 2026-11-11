import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  computed,
  effect,
  inject,
  input,
  model,
  output,
  signal,
  viewChild,
} from '@angular/core';
import {
  DESIGN_IMAGE_ACCEPT,
  DesignImageProblem,
  validateDesignImage,
} from '../../core/services/cloudinary-upload.service';

const PROBLEM_TEXT: Record<DesignImageProblem, string> = {
  type: 'Ovaj format nije podržan. Izaberite fotografiju u formatu JPG, JPEG, PNG ili WEBP.',
  size: 'Fotografija je veća od 5 MB. Izaberite manju fotografiju ili je smanjite pa pokušajte ponovo.',
  empty: 'Izabrani fajl je prazan ili oštećen. Pokušajte sa drugom fotografijom.',
};

/**
 * Optional "inspiration photo" picker for the order form.
 * Only selects + previews locally — uploading is done by the form on submit.
 */
@Component({
  selector: 'app-design-upload',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="du" [class.is-drag]="dragging()" [class.is-disabled]="disabled()">
      <input
        #picker
        class="visually-hidden"
        type="file"
        [id]="inputId"
        [accept]="accept"
        [disabled]="disabled()"
        [attr.aria-describedby]="inputId + '-help' + (error() ? ' ' + inputId + '-error' : '')"
        (change)="onPick($event)"
      />

      @if (previewSrc(); as src) {
        <div class="du__card">
          <div class="du__thumb">
            <img [src]="src" alt="Pregled fotografije koju ste izabrali" />
          </div>
          <div class="du__info">
            <p class="du__name" [title]="fileName()">{{ fileName() }}</p>
            <p class="du__meta">
              @if (file(); as f) {
                {{ sizeLabel(f.size) }} ·
              }
              @if (uploaded()) {
                <span class="du__ok">Fotografija je otpremljena ✓</span>
              } @else {
                Šalje se zajedno sa zahtevom
              }
            </p>
            <div class="du__actions">
              <label class="btn btn--sm" [attr.for]="inputId" [class.is-disabled]="disabled()"
                >Zameni</label
              >
              <button
                type="button"
                class="btn btn--sm du__remove"
                [disabled]="disabled()"
                (click)="remove()"
              >
                Ukloni
              </button>
            </div>
          </div>
        </div>
      } @else {
        <label
          class="du__drop"
          [attr.for]="inputId"
          (dragenter)="onDrag($event, true)"
          (dragover)="onDrag($event, true)"
          (dragleave)="onDrag($event, false)"
          (drop)="onDrop($event)"
        >
          <span class="du__icon" aria-hidden="true">
            <svg viewBox="0 0 24 24">
              <path d="M4 16.5V19a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-2.5" />
              <path d="M12 15V4M7.5 8.5 12 4l4.5 4.5" />
            </svg>
          </span>
          <span class="du__cta">Izaberite fotografiju</span>
          <span class="du__or">ili je prevucite ovde</span>
          <span class="du__formats">JPG, JPEG, PNG ili WEBP · najviše 5 MB · opciono</span>
        </label>
      }

      @if (error(); as msg) {
        <p class="field-error" [id]="inputId + '-error'" role="alert">{{ msg }}</p>
      }
    </div>
  `,
  styles: `
    :host {
      display: block;
    }
    .du__drop {
      display: grid;
      justify-items: center;
      gap: 6px;
      padding: clamp(26px, 4vw, 40px) 20px;
      border: 1px dashed var(--line-strong);
      background:
        radial-gradient(120% 90% at 50% 0%, rgba(227, 33, 38, 0.08), transparent 60%), var(--bg-2);
      text-align: center;
      cursor: pointer;
      transition:
        border-color 0.3s,
        background-color 0.3s,
        transform 0.3s var(--ease);
    }
    .du__drop:hover,
    .du.is-drag .du__drop,
    input:focus-visible + .du__drop {
      border-color: var(--red);
      background-color: #1a1212;
    }
    .du.is-drag .du__drop {
      transform: scale(1.01);
    }
    input:focus-visible ~ .du__drop,
    input:focus-visible ~ .du__card .du__actions label {
      outline: 2px solid var(--red);
      outline-offset: 3px;
    }
    .du__icon {
      width: 46px;
      height: 46px;
      display: grid;
      place-items: center;
      border: 1px solid var(--line-strong);
      border-radius: 50%;
      margin-bottom: 6px;
      svg {
        width: 22px;
        height: 22px;
        fill: none;
        stroke: var(--red);
        stroke-width: 1.6;
        stroke-linecap: round;
        stroke-linejoin: round;
      }
    }
    .du__cta {
      font-family: var(--font-mono);
      font-size: 0.74rem;
      letter-spacing: 0.2em;
      text-transform: uppercase;
      color: var(--text);
    }
    .du__or {
      color: var(--text-2);
      font-size: 0.9rem;
    }
    .du__formats {
      margin-top: 6px;
      font-family: var(--font-mono);
      font-size: 0.62rem;
      letter-spacing: 0.14em;
      text-transform: uppercase;
      color: var(--silver);
    }
    .du__card {
      display: grid;
      grid-template-columns: minmax(0, 200px) minmax(0, 1fr);
      gap: 20px;
      align-items: center;
      padding: 14px;
      border: 1px solid var(--line-strong);
      background: var(--bg-2);
    }
    .du__thumb {
      aspect-ratio: 1;
      background: #000;
      display: grid;
      place-items: center;
      overflow: hidden;
      position: relative;
      img {
        position: absolute;
        inset: 0;
        width: 100%;
        height: 100%;
        object-fit: contain;
        display: block;
      }
    }
    .du__info {
      min-width: 0;
    }
    .du__name {
      margin: 0;
      font-weight: 500;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .du__meta {
      margin: 6px 0 16px;
      color: var(--text-2);
      font-size: 0.86rem;
    }
    .du__ok {
      color: #7fd18b;
    }
    .du__actions {
      display: flex;
      flex-wrap: wrap;
      gap: 10px;
      label {
        cursor: pointer;
      }
    }
    .is-disabled {
      opacity: 0.5;
      pointer-events: none;
    }
    .field-error {
      margin-top: 10px;
    }
    @media (max-width: 520px) {
      .du__card {
        grid-template-columns: minmax(0, 1fr);
      }
      .du__thumb {
        aspect-ratio: 4 / 3;
      }
    }
  `,
})
export class DesignUploadComponent {
  /** The selected file (two-way bound by the form) */
  readonly file = model<File | null>(null);
  /** Already uploaded image (e.g. restored after a failed send) — shown when no local file */
  readonly remoteUrl = input<string | null>(null);
  readonly remoteName = input<string>('');
  /** The current photo is already stored on Cloudinary */
  readonly uploaded = input(false);
  readonly disabled = input(false);
  /** Visitor removed the photo (also clears any uploaded URL in the form) */
  readonly removed = output<void>();

  readonly accept = DESIGN_IMAGE_ACCEPT;
  readonly inputId = 'of-design-image';
  readonly error = signal('');
  readonly dragging = signal(false);

  private readonly picker = viewChild<ElementRef<HTMLInputElement>>('picker');
  private readonly objectUrl = signal<string | null>(null);

  readonly previewSrc = computed(() => this.objectUrl() ?? this.remoteUrl());
  readonly fileName = computed(
    () => this.file()?.name ?? (this.remoteName() || 'Ranije otpremljena fotografija'),
  );

  constructor() {
    // Local preview via an object URL; always revoke the previous one.
    effect((onCleanup) => {
      const f = this.file();
      if (!f) {
        this.objectUrl.set(null);
        return;
      }
      const url = URL.createObjectURL(f);
      this.objectUrl.set(url);
      onCleanup(() => URL.revokeObjectURL(url));
    });
    inject(DestroyRef).onDestroy(() => {
      const u = this.objectUrl();
      if (u) URL.revokeObjectURL(u);
    });
  }

  onPick(e: Event): void {
    const input = e.target as HTMLInputElement;
    const f = input.files?.[0];
    // allow picking the same file again after "Ukloni"
    input.value = '';
    if (f) this.accept_(f);
  }

  onDrag(e: DragEvent, over: boolean): void {
    if (this.disabled()) return;
    e.preventDefault();
    this.dragging.set(over);
  }

  onDrop(e: DragEvent): void {
    e.preventDefault();
    this.dragging.set(false);
    if (this.disabled()) return;
    const f = e.dataTransfer?.files?.[0];
    if (f) this.accept_(f);
  }

  remove(): void {
    this.file.set(null);
    this.error.set('');
    this.removed.emit();
    this.picker()?.nativeElement.focus();
  }

  /** Clears the validation message (used when the form is reset) */
  clearError(): void {
    this.error.set('');
  }

  sizeLabel(bytes: number): string {
    return bytes >= 1024 * 1024
      ? `${(bytes / 1024 / 1024).toFixed(1).replace('.', ',')} MB`
      : `${Math.max(1, Math.round(bytes / 1024))} KB`;
  }

  private accept_(f: File): void {
    const problem = validateDesignImage(f);
    if (problem) {
      // keep the previously selected (valid) photo, just explain why the new one was refused
      this.error.set(PROBLEM_TEXT[problem]);
      return;
    }
    this.error.set('');
    this.file.set(f);
  }
}
