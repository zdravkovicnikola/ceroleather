import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  PLATFORM_ID,
  afterNextRender,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { RouterLink } from '@angular/router';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { DeviceCapabilityService } from '../../core/services/device-capability.service';
import type { HeroScene } from '../../three/hero-scene';
import { ProductViewer3dComponent } from '../product-viewer-3d/product-viewer-3d.component';

gsap.registerPlugin(ScrollTrigger);

interface Chapter {
  index: string;
  label: string;
  title: string;
  text: string;
  side: 'left' | 'right';
}

/**
 * Cinematic hero. The section is pinned and a single GSAP timeline is scrubbed by
 * scroll position: it drives both the Three.js scene state (rotation, camera,
 * lights) and the typography, so every frame is tied to scroll — nothing autoplays.
 */
@Component({
  selector: 'app-hero',
  // Browser-dependent output (WebGL, device tier, query params) — rendered on the client, not hydrated.
  host: { ngSkipHydration: 'true' },
  imports: [RouterLink, ProductViewer3dComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './hero.component.html',
  styleUrl: './hero.component.scss',
})
export class HeroComponent {
  readonly chapters: Chapter[] = [
    {
      index: '01',
      label: 'Detalji',
      title: 'Podesivi kaiševi na čičak',
      text: 'Rastegljivi render za bolje prijanjanje, mogućnost nošenja preko moto jakne!',
      side: 'left',
    },
    {
      index: '02',
      label: 'Koža',
      title: 'Premium teleća koža',
      text: 'Pažljivo birana teleća koža prirodne teksture, prijatna na dodir — kvalitet koji se oseća pri svakom nošenju.',
      side: 'left',
    },
    {
      index: '03',
      label: 'Po meri',
      title: 'Šiveno po vašoj meri',
      text: 'Rađeni isključivo po porudžbini i Vašim merama!',
      side: 'right',
    },
  ];

  /**
   * 'pending' while prerendering on the server: the static HTML then contains neither the 3D
   * canvas nor the fallback photo, so browsers don't download a high-priority image that the
   * 3D scene replaces a moment later. The browser decides between '3d' and 'fallback'.
   */
  readonly mode = signal<'pending' | '3d' | 'fallback'>('pending');
  readonly animated: boolean;

  private readonly root = viewChild.required<ElementRef<HTMLElement>>('root');
  private readonly device = inject(DeviceCapabilityService);
  private ctx?: gsap.Context;

  constructor() {
    this.animated = !this.device.reducedMotion();
    if (isPlatformBrowser(inject(PLATFORM_ID)))
      this.mode.set(this.device.quality === 'none' ? 'fallback' : '3d');

    afterNextRender(() => this.introAnimation());
    inject(DestroyRef).onDestroy(() => this.ctx?.revert());
  }

  private introAnimation(): void {
    if (!this.animated) return;
    const el = this.root().nativeElement;
    gsap.context(() => {
      gsap.from(el.querySelectorAll('.hero__title .line > span'), {
        yPercent: 110,
        duration: 1.5,
        ease: 'expo.out',
        stagger: 0.12,
        delay: 0.2,
      });
      gsap.from(el.querySelectorAll('.hero__intro-fade'), {
        opacity: 0,
        y: 24,
        duration: 1.2,
        ease: 'expo.out',
        stagger: 0.1,
        delay: 0.7,
      });
    }, el);
  }

  onSceneReady(scene: HeroScene): void {
    this.initialComposition(scene);
    if (!this.animated) {
      // Reduced motion: a single, calm composition — no pinning, no scrubbing.
      Object.assign(scene.state, { rotY: -0.7, camZ: 5.2 });
      return;
    }
    const el = this.root().nativeElement;
    this.ctx = gsap.context(() => this.buildTimeline(el, scene), el);
  }

  /**
   * Starting position of the vest, clear of the top-left heading. Only the first frame changes:
   * the first scroll tween animates objX / objY from here to its usual targets.
   *  - landscape: shift right by ~18 % of the visible width (0.6 × aspect, scene units)
   *  - portrait: too narrow to shift sideways → start lower, below the heading (more on phones)
   */
  private initialComposition(scene: HeroScene): void {
    const el = this.root().nativeElement;
    const aspect = el.clientWidth / Math.max(1, el.clientHeight);
    if (scene.isPortrait) scene.state.objY = -(0.9 + (1 - aspect) * 1.3); // phone ≈ -1.6, tablet ≈ -1.3
    else scene.state.objX = Math.min(1.2, 0.6 * aspect);
  }

  onSceneFailed(): void {
    this.mode.set('fallback');
  }

  private buildTimeline(el: HTMLElement, scene: HeroScene): void {
    const s = scene.state;
    // horizontal offsets only on landscape screens (text sits beside the vest)
    const x = (v: number) => () => (scene.isPortrait ? 0 : v);
    const chapters = gsap.utils.toArray<HTMLElement>('.hero__chapter', el);
    const progress = el.querySelector<HTMLElement>('.hero__progress-fill');

    const tl = gsap.timeline({
      defaults: { ease: 'power2.inOut' },
      scrollTrigger: {
        trigger: el,
        start: 'top top',
        end: () => `+=${window.innerHeight * 3.6}`,
        pin: true,
        scrub: 1.1,
        anticipatePin: 1,
        invalidateOnRefresh: true,
        onUpdate: (self) => progress && (progress.style.transform = `scaleY(${self.progress})`),
      },
    });

    // ---- 0 → 2.5  intro out, turn to the side straps ------------------------
    tl.to('.hero__intro', { y: -80, opacity: 0, duration: 1.1, ease: 'power2.in' }, 0.3)
      .to('.hero__scroll', { opacity: 0, duration: 0.5 }, 0)
      // camZ 4.5 (was 3.9): the real model is fuller in profile — keep the whole side in frame
      // objY: 0 returns the portrait start position (see initialComposition); no-op on landscape
      .to(s, { rotY: -1.32, camZ: 4.5, camY: 0.05, objX: x(0.62), objY: 0, rotX: 0, duration: 2.5 }, 0)
      .to(s, { red: 0.6, duration: 2.5 }, 0)
      .fromTo(
        chapters[0],
        { opacity: 0, y: 60 },
        { opacity: 1, y: 0, duration: 0.8, ease: 'power3.out' },
        1.7,
      )
      .to(chapters[0], { opacity: 0, y: -50, duration: 0.6, ease: 'power2.in' }, 3.3)

      // ---- 2.5 → 5  close-up: leather texture, shoulder yoke ------------------
      .to(
        s,
        {
          rotY: -0.3,
          camZ: 2.45,
          camY: 0.55,
          lookY: 0.42,
          objX: x(0.32),
          key: 1.35,
          duration: 2.6,
        },
        2.7,
      )
      .fromTo(
        chapters[1],
        { opacity: 0, y: 60 },
        { opacity: 1, y: 0, duration: 0.8, ease: 'power3.out' },
        4.3,
      )
      .to(chapters[1], { opacity: 0, y: -50, duration: 0.6, ease: 'power2.in' }, 5.7)

      // ---- 5 → 7.5  pull back, reveal the back under a red rim light ----------
      .to(
        s,
        {
          rotY: -3.3,
          camZ: 4.7,
          camY: 0.1,
          lookY: 0,
          objX: x(-0.6),
          key: 0.85,
          red: 1.7,
          rim: 1.6,
          duration: 2.6,
        },
        5.4,
      )
      .fromTo(
        chapters[2],
        { opacity: 0, y: 60 },
        { opacity: 1, y: 0, duration: 0.8, ease: 'power3.out' },
        6.8,
      )
      .to(chapters[2], { opacity: 0, y: -50, duration: 0.6, ease: 'power2.in' }, 8.2)

      // ---- 7.5 → 10  final turn to the front, hand over to the next section --
      .to(
        s,
        {
          rotY: -6.55,
          camZ: 5.4,
          objX: 0,
          objY: 0.12,
          scale: 0.86,
          red: 0.5,
          rim: 1,
          key: 1,
          duration: 2.4,
        },
        8,
      )
      .fromTo(
        '.hero__outro',
        { opacity: 0, scale: 0.92 },
        { opacity: 1, scale: 1, duration: 1.2, ease: 'power3.out' },
        8.7,
      )
      .to(s, { exposure: 0.55, dust: 0, duration: 1 }, 9.6)
      .to('.hero__veil', { opacity: 1, duration: 1 }, 9.6);
  }
}
