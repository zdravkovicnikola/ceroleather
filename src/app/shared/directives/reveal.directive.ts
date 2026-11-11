import { DestroyRef, Directive, ElementRef, afterNextRender, inject, input } from '@angular/core';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { DeviceCapabilityService } from '../../core/services/device-capability.service';

gsap.registerPlugin(ScrollTrigger);

export type RevealKind = 'up' | 'fade' | 'lines' | 'image' | 'stagger';

/**
 * Scroll-triggered reveal. Content is fully visible without JS / with reduced motion;
 * hidden state is only applied right before the animation is armed.
 *
 *   <h2 appReveal="lines"><span class="line"><span>…</span></span></h2>
 *   <figure appReveal="image"><img …></figure>
 */
@Directive({ selector: '[appReveal]' })
export class RevealDirective {
  readonly appReveal = input<RevealKind | ''>('up');
  readonly revealDelay = input(0);

  private readonly el = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
  private readonly device = inject(DeviceCapabilityService);

  constructor() {
    let ctx: gsap.Context | undefined;
    afterNextRender(() => {
      if (this.device.reducedMotion()) return;
      ctx = gsap.context(() => this.arm(), this.el);
    });
    inject(DestroyRef).onDestroy(() => ctx?.revert());
  }

  private arm(): void {
    const el = this.el;
    const delay = this.revealDelay();
    const trigger = { trigger: el, start: 'top 86%', once: true };

    switch (this.appReveal() || 'up') {
      case 'lines':
        gsap.from(el.querySelectorAll('.line > span'), {
          yPercent: 115,
          rotate: 2,
          duration: 1.2,
          ease: 'expo.out',
          stagger: 0.09,
          delay,
          scrollTrigger: trigger,
        });
        break;
      case 'image': {
        const img = el.querySelector('img');
        const tl = gsap.timeline({ scrollTrigger: trigger, delay });
        tl.fromTo(el, { clipPath: 'inset(100% 0% 0% 0%)' }, { clipPath: 'inset(0% 0% 0% 0%)', duration: 1.4, ease: 'expo.inOut' });
        if (img) tl.from(img, { scale: 1.3, duration: 1.8, ease: 'expo.out' }, 0.15);
        break;
      }
      case 'stagger':
        gsap.from(el.children, {
          y: 48,
          opacity: 0,
          duration: 1,
          ease: 'expo.out',
          stagger: 0.1,
          delay,
          scrollTrigger: trigger,
        });
        break;
      case 'fade':
        gsap.from(el, { opacity: 0, duration: 1.4, ease: 'power2.out', delay, scrollTrigger: trigger });
        break;
      default:
        gsap.from(el, { y: 60, opacity: 0, duration: 1.2, ease: 'expo.out', delay, scrollTrigger: trigger });
    }
  }
}
