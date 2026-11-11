import { DestroyRef, Directive, ElementRef, afterNextRender, inject, input } from '@angular/core';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { DeviceCapabilityService } from '../../core/services/device-capability.service';

gsap.registerPlugin(ScrollTrigger);

/** Subtle scroll parallax: `<img appParallax [parallaxAmount]="12">` (percent of own height). */
@Directive({ selector: '[appParallax]' })
export class ParallaxDirective {
  readonly parallaxAmount = input(10);
  private readonly el = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
  private readonly device = inject(DeviceCapabilityService);

  constructor() {
    let ctx: gsap.Context | undefined;
    afterNextRender(() => {
      if (this.device.reducedMotion()) return;
      const a = this.parallaxAmount();
      ctx = gsap.context(() => {
        gsap.fromTo(
          this.el,
          { yPercent: -a / 2 },
          {
            yPercent: a / 2,
            ease: 'none',
            scrollTrigger: { trigger: this.el.parentElement ?? this.el, start: 'top bottom', end: 'bottom top', scrub: true },
          },
        );
      });
    });
    inject(DestroyRef).onDestroy(() => ctx?.revert());
  }
}
