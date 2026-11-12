import { Injectable, isDevMode } from '@angular/core';
import { environment } from '../../../environments/environment';

/** Formats the visitor may upload (checked by MIME type and by file extension). */
export const DESIGN_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'] as const;
export const DESIGN_IMAGE_EXTENSIONS = ['jpg', 'jpeg', 'png', 'webp'] as const;
/** 5 MB */
export const DESIGN_IMAGE_MAX_BYTES = 5 * 1024 * 1024;
/** Value for <input type="file" accept="…"> */
export const DESIGN_IMAGE_ACCEPT = '.jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp';

export type DesignImageProblem = 'type' | 'size' | 'empty';

/** Returns what is wrong with the file, or null when it can be uploaded. */
export function validateDesignImage(file: File): DesignImageProblem | null {
  if (!file.size) return 'empty';
  const ext = file.name.split('.').pop()?.toLowerCase() ?? '';
  const typeOk = (DESIGN_IMAGE_TYPES as readonly string[]).includes(file.type);
  const extOk = (DESIGN_IMAGE_EXTENSIONS as readonly string[]).includes(ext);
  // Some mobile browsers leave `type` empty — then the extension decides.
  if (!(typeOk || (!file.type && extOk)) || !extOk) return 'type';
  if (file.size > DESIGN_IMAGE_MAX_BYTES) return 'size';
  return null;
}

export class CloudinaryConfigError extends Error {
  constructor() {
    super('Cloudinary nije konfigurisan (cloudName / uploadPreset).');
    this.name = 'CloudinaryConfigError';
  }
}

/**
 *  - network  → no connection / timeout
 *  - rejected → Cloudinary refused it (4xx: preset missing or not "Unsigned", format/size not
 *               allowed by the preset)
 *  - invalid  → the file failed the local type/size check (should not happen — the picker checks)
 *  - unavailable → Cloudinary error (5xx / unexpected answer)
 */
export type UploadFailureKind = 'network' | 'rejected' | 'invalid' | 'unavailable';

export class CloudinaryUploadError extends Error {
  constructor(
    message: string,
    readonly kind: UploadFailureKind,
    readonly status?: number,
  ) {
    super(message);
    this.name = 'CloudinaryUploadError';
  }
}

export interface CloudinaryUploadResult {
  secureUrl: string;
  publicId: string;
  bytes: number;
  format: string;
}

/**
 * Uploads ONE visitor-selected inspiration photo to Cloudinary with an UNSIGNED upload preset,
 * straight from the browser (no own backend).
 *
 * Security
 * - Only the cloud name and the unsigned preset name are used. Both are public by design.
 *   The Cloudinary API key / API secret are never used or stored in this project.
 * - What an unsigned upload may do (folder, allowed formats, max size, moderation…) is decided
 *   by the preset in the Cloudinary dashboard — configure it there (see README → Cloudinary).
 * - Type and size are validated here as well, before any request is made.
 */
@Injectable({ providedIn: 'root' })
export class CloudinaryUploadService {
  private readonly config = environment.cloudinary;

  get isConfigured(): boolean {
    return !!(this.config.cloudName && this.config.uploadPreset);
  }

  get endpoint(): string {
    return `https://api.cloudinary.com/v1_1/${this.config.cloudName}/image/upload`;
  }

  /**
   * Resolves with the `secure_url` only after Cloudinary answered 200 with a URL.
   * `onProgress` receives 0–1 while the file is being sent.
   */
  upload(file: File, onProgress?: (fraction: number) => void): Promise<CloudinaryUploadResult> {
    if (!this.isConfigured) {
      this.debug('konfiguracija', 'prazno: environment.cloudinary.cloudName / uploadPreset');
      return Promise.reject(new CloudinaryConfigError());
    }
    const problem = validateDesignImage(file);
    if (problem)
      return Promise.reject(
        new CloudinaryUploadError(
          problem === 'size' ? 'Fajl je veći od 5 MB.' : 'Nepodržan format.',
          'invalid',
        ),
      );

    const body = new FormData();
    body.append('file', file);
    body.append('upload_preset', this.config.uploadPreset);

    // XMLHttpRequest (not fetch) so the form can show real upload progress.
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open('POST', this.endpoint);
      xhr.timeout = 90_000;
      xhr.responseType = 'json';
      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) onProgress?.(e.loaded / e.total);
      };
      xhr.onload = () => {
        const res = (xhr.response ?? {}) as {
          secure_url?: string;
          public_id?: string;
          bytes?: number;
          format?: string;
          error?: { message?: string };
        };
        if (xhr.status === 200 && res.secure_url?.startsWith('https://')) {
          resolve({
            secureUrl: res.secure_url,
            publicId: res.public_id ?? '',
            bytes: res.bytes ?? file.size,
            format: res.format ?? '',
          });
        } else {
          const kind = xhr.status >= 400 && xhr.status < 500 ? 'rejected' : 'unavailable';
          const msg = res.error?.message || `Neočekivan odgovor servera (${xhr.status}).`;
          this.debug(`Cloudinary (${kind})`, `status ${xhr.status}: ${msg}`);
          reject(new CloudinaryUploadError(msg, kind, xhr.status));
        }
      };
      xhr.onerror = () => {
        this.debug('mreža', 'zahtev ka api.cloudinary.com nije stigao do servera');
        reject(new CloudinaryUploadError('Mrežna greška pri otpremanju.', 'network'));
      };
      xhr.ontimeout = () => {
        this.debug('mreža', 'otpremanje je prekoračilo 90 s');
        reject(new CloudinaryUploadError('Otpremanje je trajalo predugo.', 'network'));
      };
      xhr.send(body);
    });
  }

  /** Development-only console diagnostics. */
  private debug(scope: string, detail: string): void {
    if (isDevMode())
      console.error(`[CeroLeather] Otpremanje fotografije nije uspelo — ${scope}: ${detail}`);
  }
}
