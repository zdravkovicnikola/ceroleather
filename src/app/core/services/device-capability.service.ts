import { isPlatformBrowser } from '@angular/common';
import { Injectable, PLATFORM_ID, inject, signal } from '@angular/core';

export type RenderQuality = 'high' | 'low' | 'none';

/**
 * Detects WebGL support, reduced-motion preference and a rough performance tier,
 * so 3D scenes can degrade gracefully (lower resolution, or image/SVG fallback).
 */
@Injectable({ providedIn: 'root' })
export class DeviceCapabilityService {
  readonly reducedMotion = signal(false);
  readonly isTouch: boolean;
  readonly webgl: boolean;
  readonly quality: RenderQuality;

  constructor() {
    // Prerendering on the server: no window/WebGL. Render the static (photo/SVG) variants;
    // browser-dependent components are skipped from hydration and re-render on the client.
    if (!isPlatformBrowser(inject(PLATFORM_ID))) {
      this.isTouch = false;
      this.webgl = false;
      this.quality = 'none';
      return;
    }
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    this.reducedMotion.set(mq.matches);
    mq.addEventListener('change', (e) => this.reducedMotion.set(e.matches));

    this.isTouch = window.matchMedia('(pointer: coarse)').matches;
    this.webgl = DeviceCapabilityService.detectWebGL();

    const nav = navigator as Navigator & {
      deviceMemory?: number;
      connection?: { saveData?: boolean };
    };
    const cores = nav.hardwareConcurrency ?? 4;
    const memory = nav.deviceMemory ?? 4;
    const saveData = nav.connection?.saveData === true;
    const forced = new URLSearchParams(location.search).get('quality');

    if (!this.webgl || forced === 'none') this.quality = 'none';
    else if (
      forced === 'low' ||
      saveData ||
      cores <= 4 ||
      memory <= 3 ||
      (this.isTouch && window.innerWidth < 900)
    )
      this.quality = 'low';
    else this.quality = 'high';
  }

  /** Device pixel ratio cap for renderers */
  get pixelRatio(): number {
    if (typeof window === 'undefined') return 1;
    const cap = this.quality === 'high' ? 2 : 1.5;
    return Math.min(window.devicePixelRatio || 1, cap);
  }

  private static detectWebGL(): boolean {
    try {
      const canvas = document.createElement('canvas');
      const gl = canvas.getContext('webgl2') ?? canvas.getContext('webgl');
      const ok = !!gl;
      (gl as WebGLRenderingContext | null)?.getExtension('WEBGL_lose_context')?.loseContext();
      return ok;
    } catch {
      return false;
    }
  }
}
