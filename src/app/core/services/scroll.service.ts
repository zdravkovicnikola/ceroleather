import { isPlatformBrowser } from '@angular/common';
import { DestroyRef, Injectable, PLATFORM_ID, inject } from '@angular/core';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';
import { DeviceCapabilityService } from './device-capability.service';

gsap.registerPlugin(ScrollTrigger);

/**
 * Smooth scrolling (Lenis) wired into GSAP's ticker and ScrollTrigger.
 * Disabled for users who prefer reduced motion and on touch devices (native scroll is better there).
 */
@Injectable({ providedIn: 'root' })
export class ScrollService {
  private readonly device = inject(DeviceCapabilityService);
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));
  private lenis: Lenis | null = null;
  private readonly tick = (time: number) => this.lenis?.raf(time * 1000);

  init(destroyRef: DestroyRef): void {
    if (!this.isBrowser || this.lenis || this.device.reducedMotion() || this.device.isTouch) return;

    this.lenis = new Lenis({ lerp: 0.1, smoothWheel: true, wheelMultiplier: 0.9 });
    this.lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add(this.tick);
    gsap.ticker.lagSmoothing(0);

    destroyRef.onDestroy(() => {
      gsap.ticker.remove(this.tick);
      this.lenis?.destroy();
      this.lenis = null;
    });
  }

  scrollToTop(): void {
    if (!this.isBrowser) return;
    if (this.lenis) this.lenis.scrollTo(0, { immediate: true, force: true });
    else window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
  }

  scrollTo(target: string | HTMLElement, offset = -80): void {
    if (!this.isBrowser) return;
    const el = typeof target === 'string' ? document.querySelector<HTMLElement>(target) : target;
    if (!el) return;
    if (this.lenis) {
      this.lenis.scrollTo(el, { offset, duration: 1.4 });
    } else {
      const top = el.getBoundingClientRect().top + window.scrollY + offset;
      window.scrollTo({ top, behavior: this.device.reducedMotion() ? 'auto' : 'smooth' });
    }
  }

  /** Recalculate trigger positions after layout changes (images loaded, route change) */
  refresh(): void {
    if (this.isBrowser) ScrollTrigger.refresh();
  }
}
