import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { THREE_ASSETS } from '../core/config/three-assets.config';
import { loadModel } from './model-loader';
import { disposeObject, dotTexture, radialShadowTexture } from './three-utils';

/**
 * Animatable state of the hero scene. GSAP ScrollTrigger tweens these values
 * (scrubbed by scroll position); the render loop only reads them.
 */
export interface HeroState {
  rotY: number;
  rotX: number;
  objX: number;
  objY: number;
  scale: number;
  camZ: number;
  camY: number;
  lookY: number;
  key: number;
  rim: number;
  red: number;
  exposure: number;
  dust: number;
}

export const HERO_INITIAL_STATE: HeroState = {
  rotY: -0.45,
  rotX: 0.04,
  objX: 0,
  objY: 0,
  scale: 1,
  camZ: 5.6,
  camY: 0.15,
  lookY: 0,
  key: 1,
  rim: 1,
  red: 0.35,
  exposure: 0.95,
  dust: 1,
};

export interface HeroSceneOptions {
  quality: 'high' | 'low';
  pixelRatio: number;
  reducedMotion: boolean;
  /** load the lighter GLB copy (2048² textures) — phones / low-tier GPUs */
  preferMobileModel?: boolean;
}

export class HeroScene {
  readonly state: HeroState = { ...HERO_INITIAL_STATE };

  private readonly renderer: THREE.WebGLRenderer;
  private readonly scene = new THREE.Scene();
  private readonly camera = new THREE.PerspectiveCamera(30, 1, 0.1, 50);
  private readonly pivot = new THREE.Group();
  private readonly tilt = new THREE.Group();
  private keyLight!: THREE.SpotLight;
  private rimLight!: THREE.DirectionalLight;
  private redLight!: THREE.PointLight;
  private dust?: THREE.Points;
  private shadow?: THREE.Mesh;
  private pmrem?: THREE.PMREMGenerator;
  private envTex?: THREE.Texture;
  private frame = 0;
  private running = false;
  private readonly clock = new THREE.Timer();
  private readonly pointer = new THREE.Vector2();
  private readonly pointerSmooth = new THREE.Vector2();
  private resizeObserver?: ResizeObserver;
  private aspectDistance = 1;

  constructor(
    private readonly canvas: HTMLCanvasElement,
    private readonly opts: HeroSceneOptions,
  ) {
    this.renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: opts.quality === 'high',
      alpha: true,
      powerPreference: 'high-performance',
    });
    this.renderer.setPixelRatio(opts.pixelRatio);
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.setClearColor(0x000000, 0);
  }

  /** URL of the GLB that was loaded (for diagnostics / tests) */
  modelUrl = '';

  /**
   * Loads the real CeroLeather vest (GLB). Rejects if it cannot be loaded — the component then
   * shows the photographic fallback; there is no procedural stand-in for the hero any more.
   *
   * Hierarchy (each level has ONE job, so rotations never fight):
   *   pivot  ← GSAP scroll state: rotY / rotX / position / scale (+ subtle pointer parallax)
   *   └ tilt ← idle "breathing" bob
   *     └ model-wrapper ← centring + uniform scale to targetHeight (model-loader)
   *       └ model-orientation ← fixed −90° Y: the file's front faces +X, the scene expects +Z
   *         └ gltf.scene (untouched)
   */
  async init(onProgress?: (fraction: number) => void): Promise<'glb' | 'procedural'> {
    this.pmrem = new THREE.PMREMGenerator(this.renderer);
    this.envTex = this.pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    this.scene.environment = this.envTex;
    this.scene.environmentIntensity = 0.28;

    this.setupLights();

    const { object, source, url } = await loadModel(
      THREE_ASSETS.heroVest,
      () => {
        throw new Error('hero uses no placeholder');
      },
      { preferMobile: this.opts.preferMobileModel, onProgress },
    );
    this.modelUrl = url ?? '';
    this.tilt.add(object);
    this.pivot.add(this.tilt);
    this.scene.add(this.pivot);
    // Upload the (large) textures now, before the canvas fades in, so the first scroll frames
    // don't stutter while 4K maps are pushed to the GPU.
    object.traverse((o) => {
      const mat = (o as THREE.Mesh).material as THREE.MeshStandardMaterial | undefined;
      if (!mat?.isMeshStandardMaterial) return;
      for (const tex of [mat.map, mat.normalMap, mat.roughnessMap, mat.metalnessMap])
        if (tex) this.renderer.initTexture(tex);
    });

    const shadow = new THREE.Mesh(
      new THREE.PlaneGeometry(3.2, 1.4),
      new THREE.MeshBasicMaterial({
        map: radialShadowTexture(),
        transparent: true,
        depthWrite: false,
        opacity: 0.9,
      }),
    );
    shadow.rotation.x = -Math.PI / 2;
    shadow.position.y = -THREE_ASSETS.heroVest.targetHeight / 2 - 0.18;
    this.shadow = shadow;
    this.scene.add(shadow);

    this.setupDust();
    this.resize();
    this.resizeObserver = new ResizeObserver(() => this.resize());
    this.resizeObserver.observe(this.canvas.parentElement ?? this.canvas);
    if (!this.opts.reducedMotion && window.matchMedia('(pointer: fine)').matches) {
      window.addEventListener('pointermove', this.onPointer, { passive: true });
    }
    this.renderFrame();
    return source;
  }

  private setupLights(): void {
    this.scene.add(new THREE.HemisphereLight(0x8a8a90, 0x0b0b0b, 0.35));

    this.keyLight = new THREE.SpotLight(0xfff1e2, 90, 20, Math.PI / 7, 0.65, 1.6);
    this.keyLight.position.set(2.6, 3.8, 4.2);
    this.keyLight.target.position.set(0, -0.1, 0);
    this.scene.add(this.keyLight, this.keyLight.target);

    this.rimLight = new THREE.DirectionalLight(0xdfe6ff, 2.2);
    this.rimLight.position.set(-3.5, 2, -3);
    this.scene.add(this.rimLight);

    // Brand-red rim from behind
    this.redLight = new THREE.PointLight(0xe32126, 18, 9, 1.4);
    this.redLight.position.set(2.8, 0.6, -2.4);
    this.scene.add(this.redLight);

    const fill = new THREE.DirectionalLight(0xffffff, 0.35);
    fill.position.set(-2, -1, 3);
    this.scene.add(fill);
  }

  private setupDust(): void {
    const count = this.opts.quality === 'high' ? 420 : 160;
    const pos = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 9;
      pos[i * 3 + 1] = (Math.random() - 0.5) * 6;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 6 - 0.5;
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    const mat = new THREE.PointsMaterial({
      size: 0.022,
      map: dotTexture(),
      transparent: true,
      opacity: 0.35,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      color: 0xd8d2c8,
    });
    this.dust = new THREE.Points(geo, mat);
    this.scene.add(this.dust);
  }

  private onPointer = (e: PointerEvent) => {
    this.pointer.set(
      (e.clientX / window.innerWidth) * 2 - 1,
      (e.clientY / window.innerHeight) * 2 - 1,
    );
  };

  private resize(): void {
    const el = this.canvas.parentElement ?? this.canvas;
    const w = el.clientWidth;
    const h = el.clientHeight;
    if (!w || !h) return;
    this.renderer.setSize(w, h, false);
    this.camera.aspect = w / h;
    // On portrait screens move the camera back so the vest still fits horizontally.
    this.aspectDistance = this.camera.aspect < 1 ? Math.min(1.65, 0.82 / this.camera.aspect) : 1;
    this.camera.updateProjectionMatrix();
    this.renderFrame();
  }

  get isPortrait(): boolean {
    return this.camera.aspect < 1;
  }

  start(): void {
    if (this.running) return;
    this.running = true;
    this.clock.update();
    const loop = () => {
      if (!this.running) return;
      this.clock.update();
      this.renderFrame();
      this.frame = requestAnimationFrame(loop);
    };
    this.frame = requestAnimationFrame(loop);
  }

  stop(): void {
    this.running = false;
    cancelAnimationFrame(this.frame);
  }

  private renderFrame(): void {
    const s = this.state;
    const t = this.clock.getElapsed();
    const idle = this.opts.reducedMotion ? 0 : 1;

    this.pointerSmooth.lerp(this.pointer, 0.05);
    this.pivot.rotation.y = s.rotY + this.pointerSmooth.x * 0.12 * idle;
    this.pivot.rotation.x = s.rotX + this.pointerSmooth.y * 0.05 * idle;
    this.tilt.position.y = Math.sin(t * 0.8) * 0.025 * idle;
    this.tilt.rotation.z = Math.sin(t * 0.5) * 0.01 * idle;
    this.pivot.position.set(s.objX, s.objY, 0);
    this.pivot.scale.setScalar(s.scale);

    // portrait: look lower so the vest sits in the upper half, above the typography
    const lift = this.camera.aspect < 1 ? -0.55 : 0;
    this.camera.position.set(0, s.camY + lift, s.camZ * this.aspectDistance);
    this.camera.lookAt(0, s.lookY + lift, 0);

    this.keyLight.intensity = 90 * s.key;
    this.rimLight.intensity = 2.2 * s.rim;
    this.redLight.intensity = 30 * s.red;
    this.renderer.toneMappingExposure = s.exposure;

    if (this.shadow) {
      this.shadow.position.x = s.objX;
      (this.shadow.material as THREE.MeshBasicMaterial).opacity = 0.9 * Math.min(1, s.scale);
    }
    if (this.dust) {
      this.dust.rotation.y = t * 0.015 * idle;
      this.dust.position.y = Math.sin(t * 0.2) * 0.1 * idle;
      (this.dust.material as THREE.PointsMaterial).opacity = 0.35 * s.dust;
    }
    this.renderer.render(this.scene, this.camera);
  }

  dispose(): void {
    this.stop();
    this.resizeObserver?.disconnect();
    window.removeEventListener('pointermove', this.onPointer);
    disposeObject(this.scene);
    this.envTex?.dispose();
    this.pmrem?.dispose();
    this.renderer.dispose();
    this.renderer.forceContextLoss();
  }
}
