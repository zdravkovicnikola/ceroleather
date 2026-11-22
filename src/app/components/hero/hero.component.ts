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
import type { HeroScene, HeroState } from '../../three/hero-scene';
import { ProductViewer3dComponent } from '../product-viewer-3d/product-viewer-3d.component';

gsap.registerPlugin(ScrollTrigger);

interface Chapter {
  index: string;
  label: string;
  title: string;
  text: string;
  side: 'left' | 'right';
}

/** hero-relative rectangle (CSS px) */
interface Area {
  left: number;
  right: number;
  top: number;
  bottom: number;
}

/** largest starting scale of the vest (1 = the scroll animation's own size) */
const HERO_MAX_SCALE = 1.25;

/**
 * Portrait chapters: `bottom` of the text block before the scene 01 / 03 refinement (.scss).
 * Scene 03's vest moves down by exactly as much as its text moved from here.
 */
const PORTRAIT_TEXT_BASE_BOTTOM = 56;
/**
 * Scene 01 on portrait: vest AND text sit this much lower than the centred placement
 * (must equal the `- 12px` on .hero__chapter[data-scene='01'] in hero.component.scss).
 */
const S1_PORTRAIT_DROP = 12;
/** on short phones the vest may shrink this far (at most) to fit between header and text */
const PORTRAIT_MIN_SCALE = 0.9;

/** final scene: landscape end height of the vest and the timeline time the final turn starts */
const END_OBJ_Y = 0.12;
const END_START = 8;

/** state values a portrait measurement temporarily overrides (restored afterwards) */
const POSE_KEYS = ['rotY', 'rotX', 'objX', 'objY', 'scale', 'camZ', 'camY', 'lookY'] as const;

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
    if (!this.animated) {
      // Reduced motion: a single, calm composition — no pinning, no scrubbing.
      Object.assign(scene.state, { rotY: -0.7, camZ: 5.2 });
      this.initialComposition(scene);
      return;
    }
    this.initialComposition(scene);
    const el = this.root().nativeElement;
    this.ctx = gsap.context(() => this.buildTimeline(el, scene), el);
  }

  /**
   * Starting size and position of the vest, composed around the REAL text layout. Only the first
   * frame changes: the first scroll tween animates scale / objX / objY back to their usual values,
   * so every later chapter (camera, close-up framing) is exactly as before.
   *
   * Two candidate areas, measured in the DOM, and the one that fits a larger vest wins:
   *  - beside the text: from the right edge of the heading/buttons to the right edge (desktop)
   *  - below the buttons, full width (portrait, phones, narrow landscape)
   * The vest is scaled to fit the area (at most HERO_MAX_SCALE, never stretched — uniform scale)
   * and centred in it. Measurements use the projected bounding box, so it never touches the text.
   */
  private initialComposition(scene: HeroScene): void {
    const el = this.root().nativeElement;
    const hero = el.getBoundingClientRect();
    const s = scene.state;
    const W = hero.width;
    const H = hero.height;
    if (!W || !H || !scene.modelScreenRect()) return;

    // painted extents of the intro (inline text boxes, not the full-width block boxes)
    const text = { left: Infinity, top: Infinity, right: -Infinity, bottom: -Infinity };
    const add = (r: DOMRect) => {
      if (!r.width || !r.height) return;
      text.left = Math.min(text.left, r.left - hero.left);
      text.right = Math.max(text.right, r.right - hero.left);
      text.top = Math.min(text.top, r.top - hero.top);
      text.bottom = Math.max(text.bottom, r.bottom - hero.top);
    };
    const range = document.createRange();
    // text: the glyph boxes (the heading's line spans are full-width blocks)
    el.querySelectorAll('.hero__intro .eyebrow, .hero__title .line > span, .hero__intro .lead').forEach(
      (n) => {
        range.selectNodeContents(n);
        add(range.getBoundingClientRect());
      },
    );
    el.querySelectorAll('.hero__actions > *').forEach((n) => add(n.getBoundingClientRect()));
    if (!Number.isFinite(text.right)) return;

    const headerH = parseFloat(getComputedStyle(el).getPropertyValue('--header-h')) || 76;
    const pad = Math.max(16, Math.min(W, H) * 0.03);
    const areas: Area[] = [
      // beside the text; bottom keeps room for the contact shadow under the hem
      { left: text.right + Math.max(40, W * 0.035), right: W - Math.max(pad, W * 0.03), top: headerH + pad, bottom: H - pad * 2.5 },
      { left: pad, right: W - pad, top: text.bottom + Math.max(20, H * 0.03), bottom: H - pad * 1.5 },
    ];

    // size of the vest at scale 1, centred
    Object.assign(s, { scale: 1, objX: 0, objY: 0 });
    const base = this.size(scene);
    let best: { area: Area; scale: number } | null = null;
    for (const a of areas) {
      if (a.right - a.left <= 0 || a.bottom - a.top <= 0) continue;
      const scale = Math.min(
        HERO_MAX_SCALE,
        (a.right - a.left) / base.w,
        (a.bottom - a.top) / base.h,
      );
      if (!best || scale > best.scale) best = { area: a, scale };
    }
    if (!best) return;

    // Centre it in the chosen area, then re-measure: off-centre, perspective shows more of the
    // vest's side and straps, so it projects wider than when it was measured in the middle.
    s.scale = best.scale;
    const a = best.area;
    for (let i = 0; i < 4; i++) {
      this.centreIn(scene, a);
      const r = this.size(scene);
      const fit = Math.min(1, (a.right - a.left) / r.w, (a.bottom - a.top) / r.h);
      if (fit > 0.995) break;
      s.scale *= fit;
    }
    this.centreIn(scene, a);
  }

  /** move the vest so its projected centre is the centre of `a` (two passes for perspective) */
  private centreIn(scene: HeroScene, a: Area): void {
    const s = scene.state;
    for (let i = 0; i < 2; i++) {
      const r0 = this.size(scene);
      s.objX += 1;
      s.objY += 1;
      const r1 = this.size(scene);
      s.objX -= 1;
      s.objY -= 1;
      s.objX += ((a.left + a.right) / 2 - r0.cx) / (r1.cx - r0.cx);
      s.objY += ((a.top + a.bottom) / 2 - r0.cy) / (r1.cy - r0.cy);
    }
  }

  /** projected vest size / centre in hero-relative px for the current scene state */
  private size(scene: HeroScene): { w: number; h: number; cx: number; cy: number } {
    const hero = this.root().nativeElement.getBoundingClientRect();
    const r = scene.modelScreenRect()!;
    return {
      w: r.right - r.left,
      h: r.bottom - r.top,
      cx: (r.left + r.right) / 2 - hero.left,
      cy: (r.top + r.bottom) / 2 - hero.top,
    };
  }

  onSceneFailed(): void {
    this.mode.set('fallback');
  }

  private readonly poseCache = new Map<string, { objY: number; scale: number }>();

  /**
   * Final scene (front view + "CeroLeather" outline lettering). Landscape: objY 0.12 as before.
   * Portrait: the camera looks lower (HeroScene.cameraLift) so the vest sat high, against the
   * header, with the lettering behind its lower part. The vest is centred in the space below the
   * header instead, and the lettering is moved down by the SAME number of pixels
   * (--outro-shift), so the two keep their relationship. Size and rotation are unchanged.
   */
  private endObjY(scene: HeroScene, pose: Partial<HeroState>): number {
    const el = this.root().nativeElement;
    const landscape = END_OBJ_Y;
    this.outroPxPerUnit = 0;
    if (!scene.isPortrait || !scene.modelScreenRect()) return landscape;
    const s = scene.state;
    const saved = POSE_KEYS.map((k) => s[k]);
    Object.assign(s, pose, { objY: landscape });

    const H = el.clientHeight;
    const headerH = parseFloat(getComputedStyle(el).getPropertyValue('--header-h')) || 76;
    const start = this.size(scene);
    const target = Math.max((headerH + H) / 2, headerH + Math.max(12, H * 0.015) + start.h / 2);
    for (let i = 0; i < 2; i++) {
      const r0 = this.size(scene);
      s.objY += 1;
      const r1 = this.size(scene);
      s.objY -= 1;
      s.objY += (target - r0.cy) / (r1.cy - r0.cy);
    }
    const objY = s.objY;
    const shift = this.size(scene).cy - start.cy;
    POSE_KEYS.forEach((k, i) => (s[k] = saved[i]));
    if (Math.abs(objY - landscape) > 1e-4) this.outroPxPerUnit = shift / (objY - landscape);
    return objY;
  }

  /** px the lettering moves per scene unit the vest is below its landscape end position */
  private outroPxPerUnit = 0;
  private outroShift = '';

  /**
   * Keeps the lettering moving WITH the vest during the final scene (the vest eases into its
   * portrait position while the lettering is visible). Landscape: always 0px — unchanged.
   */
  private syncOutro(s: HeroState, time: number): void {
    const px = time >= END_START ? Math.round((s.objY - END_OBJ_Y) * this.outroPxPerUnit) : 0;
    const value = `${px}px`;
    if (value === this.outroShift) return;
    this.outroShift = value;
    this.root().nativeElement.style.setProperty('--outro-shift', value);
  }

  /**
   * Portrait screens only — vertical placement of the vest for a chapter, from the real layout:
   * free space = from just under the header to just above that chapter's text block.
   *  - 'centre': vest centred in that space, then moved down by `drop` px together with the text
   *    (scene 01 — the space is measured without the text's extra `drop`, so size and spacing
   *    are those of the centred placement)
   *  - 'follow': vest moved down by as much as the text moved (scene 03 — spacing preserved)
   * Either way it is kept inside the space; the size stays 1 unless a short phone can't fit it
   * (then at most PORTRAIT_MIN_SCALE). Landscape returns the original values (objY 0, scale 1).
   * `pose` = the chapter's camera / rotation targets from the timeline, so it is measured as shown.
   */
  private portraitPose(
    scene: HeroScene,
    chapter: HTMLElement,
    pose: Partial<HeroState>,
    mode: 'centre' | 'follow',
    drop = 0,
  ): { objY: number; scale: number } {
    if (!scene.isPortrait || !scene.modelScreenRect()) return { objY: 0, scale: 1 };
    const el = this.root().nativeElement;
    const H = el.clientHeight;
    const key = `${chapter.dataset['scene']}:${el.clientWidth}x${H}`;
    const cached = this.poseCache.get(key);
    if (cached) return cached;

    const s = scene.state;
    const saved = POSE_KEYS.map((k) => s[k]);
    Object.assign(s, pose, { objX: 0, objY: 0, scale: 1 });

    const headerH = parseFloat(getComputedStyle(el).getPropertyValue('--header-h')) || 76;
    // layout position (offsetTop ignores the GSAP fade-in transform); .hero__chapters is inset: 0
    const top = headerH + Math.max(12, H * 0.015);
    // space above the text as it would be without the extra drop; the drop is added afterwards
    const bottom = chapter.offsetTop - drop - Math.max(16, H * 0.025);

    const before = this.size(scene);
    s.scale = Math.max(PORTRAIT_MIN_SCALE, Math.min(1, (bottom - top) / before.h));
    const r = this.size(scene);
    let target =
      mode === 'centre'
        ? (top + bottom) / 2
        : r.cy + (PORTRAIT_TEXT_BASE_BOTTOM - parseFloat(getComputedStyle(chapter).bottom));
    target = Math.max(target, top + r.h / 2); // never under the header
    target = Math.min(target, Math.max(top + r.h / 2, bottom - r.h / 2)); // never into the text
    target += drop;

    for (let i = 0; i < 2; i++) {
      const r0 = this.size(scene);
      s.objY += 1;
      const r1 = this.size(scene);
      s.objY -= 1;
      s.objY += (target - r0.cy) / (r1.cy - r0.cy);
    }
    const result = { objY: s.objY, scale: s.scale };
    POSE_KEYS.forEach((k, i) => (s[k] = saved[i]));
    this.poseCache.set(key, result);
    return result;
  }

  private buildTimeline(el: HTMLElement, scene: HeroScene): void {
    const s = scene.state;
    // horizontal offsets only on landscape screens (text sits beside the vest)
    const x = (v: number) => () => (scene.isPortrait ? 0 : v);
    const chapters = gsap.utils.toArray<HTMLElement>('.hero__chapter', el);
    const progress = el.querySelector<HTMLElement>('.hero__progress-fill');
    // portrait-only vertical placement for scenes 01 and 03 (landscape: objY 0, scale 1 as before)
    const s1Pose = { rotY: -1.32, camZ: 4.5, camY: 0.05, lookY: 0, rotX: 0 };
    const s3Pose = { rotY: -3.3, camZ: 4.7, camY: 0.1, lookY: 0, rotX: 0 };
    const p1 = () => this.portraitPose(scene, chapters[0], s1Pose, 'centre', S1_PORTRAIT_DROP);
    const p3 = () => this.portraitPose(scene, chapters[2], s3Pose, 'follow');

    const tl = gsap.timeline({
      defaults: { ease: 'power2.inOut' },
      // lettering follows the vest in the final scene (portrait only; see endObjY / syncOutro)
      onUpdate: () => this.syncOutro(s, tl.time()),
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
      // objY / scale return from the composed start (see initialComposition): 0 / 1 on landscape,
      // on portrait the vest is placed between header and the scene 01 text (portraitPose)
      .to(
        s,
        {
          ...s1Pose,
          objX: x(0.62),
          objY: () => p1().objY,
          scale: () => p1().scale,
          duration: 2.5,
        },
        0,
      )
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
          // back to the original close-up framing after the portrait scene 01 offset (no-op on landscape)
          objY: 0,
          scale: 1,
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
          // portrait: a little lower, following the scene 03 text (landscape: 0 / 1, as before)
          objY: () => p3().objY,
          scale: () => p3().scale,
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
          // 0.12 on landscape; portrait: centred below the header, lettering follows (endObjY)
          objY: () =>
            this.endObjY(scene, { rotY: -6.55, camZ: 5.4, camY: 0.1, lookY: 0, rotX: 0, objX: 0, scale: 0.86 }),
          // (END_OBJ_Y / END_START above mirror this tween's landscape objY and start time)
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
