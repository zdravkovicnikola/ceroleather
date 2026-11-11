import * as THREE from 'three';
import { buildRibbon, buildSurfaceGeometry, sampleKeyframes, spow, surfaceNormal, SurfaceFn } from './three-utils';

/**
 * PROCEDURAL PLACEHOLDER VEST
 * ---------------------------
 * A real 3D mesh (not an image) modelled after the "Strap" reference vest:
 * quilted shoulder yoke, diagonal front panels, vertical zip pockets,
 * ribbed elastic side panels with 4 leather straps + metal buckles per side,
 * central zipper and leather piping on all edges.
 *
 * The surface is a parametric tube: u = around the body (0 = centre front),
 * v = height (0 = hem, 1 = neck). Cut-outs (armholes / neckline) are done
 * with an alpha map in the same UV space, and seams are painted into
 * bump / colour / roughness maps in that UV space too.
 *
 * Replace with a real GLB via THREE_ASSETS.heroVest.glbUrl.
 */

export interface VestOptions {
  quality: 'high' | 'low';
}

// [v, y, halfWidth, halfDepth]
const PROFILE: number[][] = [
  [0.0, -0.95, 0.8, 0.5],
  [0.25, -0.52, 0.78, 0.48],
  [0.5, -0.08, 0.84, 0.54],
  [0.7, 0.28, 0.88, 0.55],
  [0.82, 0.5, 0.87, 0.5],
  [0.88, 0.63, 0.74, 0.42],
  [0.93, 0.72, 0.5, 0.32],
  [0.97, 0.775, 0.335, 0.268],
  [1.0, 0.83, 0.31, 0.252],
];

const SUPER = 2 / 2.5; // superellipse exponent → slightly boxy cross-section

export const vestSurface: SurfaceFn = (u, v, target) => {
  const y = sampleKeyframes(PROFILE, v, 1);
  const a = sampleKeyframes(PROFILE, v, 2);
  const b = sampleKeyframes(PROFILE, v, 3);
  const th = u * Math.PI * 2;
  const s = Math.sin(th);
  const c = Math.cos(th);
  // slightly flatter back, fuller chest
  const depth = c > 0 ? b * (1 + 0.05 * Math.exp(-((v - 0.62) ** 2) / 0.02)) : b * 0.94;
  return target.set(a * spow(s, SUPER), y, depth * spow(c, SUPER));
};

/** Distance in u from the centre front (u wraps at 0/1). */
const du0 = (u: number) => Math.min(u, 1 - u);

/** Neckline height for every u (front scoop + small back scoop). */
export function neckV(u: number): number {
  let v = 0.975;
  const f = du0(u);
  if (f < 0.09) v = Math.min(v, 0.975 - 0.11 * Math.sqrt(1 - (f / 0.09) ** 2));
  const bk = Math.abs(u - 0.5);
  if (bk < 0.07) v = Math.min(v, 0.975 - 0.03 * Math.sqrt(1 - (bk / 0.07) ** 2));
  return v;
}

const ARM = { v0: 0.655, du: 0.085, dv: 0.215 };
const ARM_CENTERS = [0.25, 0.75];

/** Point on armhole outline, t in [0, 1). Superellipse for a slightly squared shape. */
function armholePoint(center: number, t: number): [number, number] {
  const a = t * Math.PI * 2;
  const e = 2 / 2.6;
  return [center + ARM.du * spow(Math.cos(a), e), ARM.v0 + ARM.dv * spow(Math.sin(a), e)];
}

// ---------------------------------------------------------------------------
// Texture painting in UV space
// ---------------------------------------------------------------------------

function makeCanvas(w: number, h: number): [HTMLCanvasElement, CanvasRenderingContext2D] {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  return [c, c.getContext('2d')!];
}

/** Tileable pebble-grain tile (grey = 128 neutral height). */
function grainTile(size: number): HTMLCanvasElement {
  const [c, ctx] = makeCanvas(size, size);
  ctx.fillStyle = 'rgb(112,112,112)';
  ctx.fillRect(0, 0, size, size);
  const count = Math.round(size * size * 0.09);
  let seed = 7;
  const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
  for (let i = 0; i < count; i++) {
    const x = rnd() * size;
    const y = rnd() * size;
    const r = 0.9 + rnd() * 1.6;
    const rot = rnd() * Math.PI;
    const l = 140 + rnd() * 40;
    for (const ox of [-size, 0, size]) {
      for (const oy of [-size, 0, size]) {
        const px = x + ox;
        const py = y + oy;
        if (px < -8 || py < -8 || px > size + 8 || py > size + 8) continue;
        const g = ctx.createRadialGradient(px, py, 0, px, py, r);
        g.addColorStop(0, `rgba(${l},${l},${l},0.8)`);
        g.addColorStop(1, 'rgba(90,90,90,0)');
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.ellipse(px, py, r, r * (0.65 + rnd() * 0.35), rot, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }
  return c;
}

interface Painter {
  W: number;
  H: number;
  px: (u: number, v: number) => [number, number];
}

function polyline(ctx: CanvasRenderingContext2D, p: Painter, pts: [number, number][]) {
  ctx.beginPath();
  pts.forEach(([u, v], i) => {
    const [x, y] = p.px(u, v);
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  });
}

const mirror = (pts: [number, number][]) => pts.map(([u, v]) => [1 - u, v] as [number, number]);

/** All seam polylines of the design, in UV space. */
function seamLines(): [number, number][][] {
  const frontLeft: [number, number][][] = [
    // shoulder yoke border
    [
      [0.012, 0.79],
      [0.1, 0.8],
      [0.168, 0.83],
    ],
    // chest seam with chevron toward the armhole
    [
      [0.012, 0.6],
      [0.115, 0.6],
      [0.152, 0.555],
    ],
    // long diagonal panel seam from armhole to hem
    [
      [0.168, 0.46],
      [0.14, 0.32],
      [0.113, 0.16],
      [0.095, 0.01],
    ],
    // side panel borders
    [
      [0.212, 0.01],
      [0.212, 0.445],
    ],
    [
      [0.288, 0.01],
      [0.288, 0.445],
    ],
  ];
  const back: [number, number][][] = [
    [
      [0.32, 0.775],
      [0.68, 0.775],
    ],
    [
      [0.5, 0.01],
      [0.5, 0.775],
    ],
  ];
  return [...frontLeft, ...frontLeft.map(mirror), ...back];
}

/** Quilted ribs on the front shoulder yoke. */
function yokeRibs(): [number, number][][] {
  const ribs: [number, number][][] = [];
  for (let k = 0; k < 6; k++) {
    const v = 0.815 + k * 0.026;
    const left: [number, number][] = [
      [0.03 + k * 0.004, v],
      [0.1, v + 0.008],
      [0.16 - k * 0.01, v + 0.03],
    ];
    ribs.push(left, mirror(left));
  }
  return ribs;
}

interface VestTextures {
  map: THREE.CanvasTexture;
  bump: THREE.CanvasTexture;
  rough: THREE.CanvasTexture;
  alpha: THREE.CanvasTexture;
}

function paintTextures(quality: 'high' | 'low'): VestTextures {
  const W = quality === 'high' ? 2048 : 1024;
  const H = W / 2;
  const p: Painter = { W, H, px: (u, v) => [u * W, (1 - v) * H] };
  const k = W / 2048;

  // ---- bump -------------------------------------------------------------
  const [bumpC, b] = makeCanvas(W, H);
  const tile = grainTile(quality === 'high' ? 256 : 128);
  const pattern = b.createPattern(tile, 'repeat')!;
  // world units per pixel differ in u and v → squash pattern horizontally to keep pebbles round
  pattern.setTransform(new DOMMatrix().scale(0.78 * (quality === 'high' ? 1 : 1), 1));
  b.fillStyle = pattern;
  b.fillRect(0, 0, W, H);

  // ribbed elastic side panels
  for (const c of ARM_CENTERS) {
    const [x0] = p.px(c - 0.036, 0);
    const [x1] = p.px(c + 0.036, 0);
    const [, yTop] = p.px(0, 0.445);
    b.fillStyle = 'rgb(100,100,100)';
    b.fillRect(x0, yTop, x1 - x0, H - yTop);
    for (let x = x0; x < x1; x += 4 * k + 1) {
      b.fillStyle = 'rgb(150,150,150)';
      b.fillRect(x, yTop, 1.6 * k + 0.6, H - yTop);
    }
  }

  const groove = (pts: [number, number][], width: number) => {
    b.lineCap = 'round';
    b.lineJoin = 'round';
    b.strokeStyle = 'rgba(20,20,20,0.95)';
    b.lineWidth = width * k;
    polyline(b, p, pts);
    b.stroke();
    b.strokeStyle = 'rgba(190,190,190,0.55)';
    b.lineWidth = width * 0.6 * k;
    b.setLineDash([]);
    // raised ridge on one side of the seam (folded leather edge)
    b.save();
    b.translate(width * 0.9 * k, -width * 0.4 * k);
    polyline(b, p, pts);
    b.stroke();
    b.restore();
  };
  const stitches = (ctx: CanvasRenderingContext2D, pts: [number, number][], offset: number, style: string) => {
    ctx.save();
    ctx.setLineDash([5 * k, 3.5 * k]);
    ctx.strokeStyle = style;
    ctx.lineWidth = 1.4 * k + 0.4;
    for (const o of [-offset, offset]) {
      ctx.save();
      ctx.translate(o * k, 0);
      polyline(ctx, p, pts);
      ctx.stroke();
      ctx.restore();
    }
    ctx.restore();
  };

  for (const s of seamLines()) groove(s, 5);
  for (const r of yokeRibs()) groove(r, 4);
  for (const s of seamLines()) stitches(b, s, 7, 'rgba(70,70,70,0.9)');

  // ---- colour ------------------------------------------------------------
  const [mapC, m] = makeCanvas(W, H);
  m.fillStyle = '#0f0f0f';
  m.fillRect(0, 0, W, H);
  // subtle tonal variation (worn / natural hide)
  for (let i = 0; i < 40; i++) {
    const x = Math.random() * W;
    const y = Math.random() * H;
    const r = (80 + Math.random() * 220) * k;
    const g = m.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, `rgba(${30 + Math.random() * 10},${28 + Math.random() * 8},${26},0.35)`);
    g.addColorStop(1, 'rgba(0,0,0,0)');
    m.fillStyle = g;
    m.fillRect(x - r, y - r, r * 2, r * 2);
  }
  m.globalAlpha = 0.18;
  m.drawImage(bumpC, 0, 0);
  m.globalAlpha = 1;
  for (const c of ARM_CENTERS) {
    const [x0] = p.px(c - 0.036, 0);
    const [x1] = p.px(c + 0.036, 0);
    const [, yTop] = p.px(0, 0.445);
    m.fillStyle = '#0a0a0b';
    m.fillRect(x0, yTop, x1 - x0, H - yTop);
  }
  for (const s of seamLines()) {
    m.strokeStyle = '#070707';
    m.lineWidth = 4 * k;
    polyline(m, p, s);
    m.stroke();
    stitches(m, s, 7, 'rgba(58,58,58,0.95)');
  }
  for (const r of yokeRibs()) {
    m.strokeStyle = '#080808';
    m.lineWidth = 3 * k;
    polyline(m, p, r);
    m.stroke();
  }

  // ---- roughness (inverse-ish of grain: pebble tops slightly glossier) ---
  const [roughC, r] = makeCanvas(W, H);
  r.fillStyle = 'rgb(172,172,172)';
  r.fillRect(0, 0, W, H);
  r.globalAlpha = 0.14;
  r.globalCompositeOperation = 'difference';
  r.drawImage(bumpC, 0, 0);
  r.globalCompositeOperation = 'source-over';
  r.globalAlpha = 1;
  for (const c of ARM_CENTERS) {
    const [x0] = p.px(c - 0.036, 0);
    const [x1] = p.px(c + 0.036, 0);
    const [, yTop] = p.px(0, 0.445);
    r.fillStyle = 'rgb(235,235,235)';
    r.fillRect(x0, yTop, x1 - x0, H - yTop);
  }

  // ---- alpha (armholes + neckline) ----------------------------------------
  const AW = W / 2;
  const AH = H / 2;
  const [alphaC, a] = makeCanvas(AW, AH);
  const ap = (u: number, v: number): [number, number] => [u * AW, (1 - v) * AH];
  a.fillStyle = '#fff';
  a.fillRect(0, 0, AW, AH);
  a.fillStyle = '#000';
  for (const c of ARM_CENTERS) {
    a.beginPath();
    for (let i = 0; i <= 96; i++) {
      const [u, v] = armholePoint(c, i / 96);
      const [x, y] = ap(u, v);
      if (i === 0) a.moveTo(x, y);
      else a.lineTo(x, y);
    }
    a.fill();
  }
  a.beginPath();
  a.moveTo(0, 0);
  for (let i = 0; i <= 256; i++) {
    const u = i / 256;
    const [x, y] = ap(u, neckV(u));
    a.lineTo(x, y);
  }
  a.lineTo(AW, 0);
  a.closePath();
  a.fill();

  const tex = (c: HTMLCanvasElement, srgb = false) => {
    const t = new THREE.CanvasTexture(c);
    t.anisotropy = 4;
    if (srgb) t.colorSpace = THREE.SRGBColorSpace;
    return t;
  };
  return { map: tex(mapC, true), bump: tex(bumpC), rough: tex(roughC), alpha: tex(alphaC) };
}

// ---------------------------------------------------------------------------
// 3D details
// ---------------------------------------------------------------------------

function surfacePoint(u: number, v: number, lift = 0): THREE.Vector3 {
  const p = vestSurface(((u % 1) + 1) % 1, v, new THREE.Vector3());
  if (lift) p.addScaledVector(surfaceNormal(vestSurface, ((u % 1) + 1) % 1, v), lift);
  return p;
}

function tubeAlong(uvPts: [number, number][], radius: number, closed: boolean, mat: THREE.Material, segs: number) {
  const pts = uvPts.map(([u, v]) => surfacePoint(u, v, radius * 0.3));
  const curve = new THREE.CatmullRomCurve3(pts, closed, 'centripetal');
  return new THREE.Mesh(new THREE.TubeGeometry(curve, segs, radius, 6, closed), mat);
}

/** Zipper: tape + instanced teeth + slider, following the surface along v at fixed u. */
function zipper(
  u: number,
  v0: number,
  v1: number,
  materials: { tape: THREE.Material; teeth: THREE.Material; metal: THREE.Material },
  teethCount: number,
  scale = 1,
): THREE.Group {
  const g = new THREE.Group();
  const steps = 60;
  const pts: THREE.Vector3[] = [];
  const nrm: THREE.Vector3[] = [];
  const sides: THREE.Vector3[] = [];
  for (let i = 0; i <= steps; i++) {
    const v = v0 + ((v1 - v0) * i) / steps;
    const uu = ((u % 1) + 1) % 1;
    pts.push(vestSurface(uu, v, new THREE.Vector3()));
    const n = surfaceNormal(vestSurface, uu, v);
    nrm.push(n);
    const tangent = vestSurface(uu, Math.min(1, v + 0.002), new THREE.Vector3()).sub(pts[i]).normalize();
    sides.push(new THREE.Vector3().crossVectors(tangent, n).normalize());
  }
  const tape = buildRibbon(pts, sides, nrm, 0.028 * scale, 0.004);
  g.add(new THREE.Mesh(tape.geometry, materials.tape));

  const curve = new THREE.CatmullRomCurve3(pts);
  const toothGeo = new THREE.BoxGeometry(0.011 * scale, 0.0042 * scale, 0.005 * scale);
  const teeth = new THREE.InstancedMesh(toothGeo, materials.teeth, teethCount);
  const m = new THREE.Matrix4();
  const q = new THREE.Quaternion();
  const basis = new THREE.Matrix4();
  for (let i = 0; i < teethCount; i++) {
    const t = i / (teethCount - 1);
    const p = curve.getPointAt(t);
    const k = Math.min(steps, Math.round(t * steps));
    const n = nrm[k];
    const s = sides[k];
    const up = new THREE.Vector3().crossVectors(n, s).normalize();
    basis.makeBasis(s, up, n);
    q.setFromRotationMatrix(basis);
    const off = (i % 2 === 0 ? -1 : 1) * 0.0035 * scale;
    p.addScaledVector(s, off).addScaledVector(n, 0.0075);
    m.compose(p, q, new THREE.Vector3(1, 1, 1));
    teeth.setMatrixAt(i, m);
  }
  teeth.instanceMatrix.needsUpdate = true;
  g.add(teeth);

  // slider + pull tab at the top
  const top = pts[steps];
  const n = nrm[steps];
  const s = sides[steps];
  const up = new THREE.Vector3().crossVectors(n, s).normalize();
  basis.makeBasis(s, up, n);
  const slider = new THREE.Mesh(new THREE.BoxGeometry(0.03 * scale, 0.034 * scale, 0.014 * scale), materials.metal);
  slider.position.copy(top).addScaledVector(n, 0.014).addScaledVector(up, -0.016 * scale);
  slider.quaternion.setFromRotationMatrix(basis);
  const pull = new THREE.Mesh(new THREE.BoxGeometry(0.016 * scale, 0.05 * scale, 0.006 * scale), materials.metal);
  pull.position.copy(slider.position).addScaledVector(up, -0.035 * scale).addScaledVector(n, 0.01);
  pull.quaternion.copy(slider.quaternion);
  g.add(slider, pull);
  return g;
}

/** Leather strap across the elastic side panel with a metal buckle. */
function sideStrap(center: number, v: number, dir: 1 | -1, leather: THREE.Material, metal: THREE.Material) {
  const g = new THREE.Group();
  const pts: THREE.Vector3[] = [];
  const nrm: THREE.Vector3[] = [];
  const sides: THREE.Vector3[] = [];
  const u0 = center - 0.052 * dir;
  const u1 = center + 0.03 * dir;
  for (let i = 0; i <= 16; i++) {
    const u = u0 + ((u1 - u0) * i) / 16;
    const p = vestSurface(u, v, new THREE.Vector3());
    const n = surfaceNormal(vestSurface, u, v);
    pts.push(p);
    nrm.push(n);
    sides.push(new THREE.Vector3(0, 1, 0));
  }
  const ribbon = buildRibbon(pts, sides, nrm, 0.05, 0.011);
  g.add(new THREE.Mesh(ribbon.geometry, leather));

  const end = pts[16];
  const n = nrm[16];
  const buckle = new THREE.Mesh(new THREE.TorusGeometry(0.024, 0.0032, 6, 4), metal);
  buckle.position.copy(end).addScaledVector(n, 0.016);
  buckle.lookAt(end.clone().addScaledVector(n, 1));
  buckle.rotateZ(Math.PI / 4);
  buckle.scale.set(0.75, 1.05, 1);
  g.add(buckle);
  return g;
}

export function createProceduralVest(opts: VestOptions): THREE.Group {
  const high = opts.quality === 'high';
  const tex = paintTextures(opts.quality);
  const group = new THREE.Group();
  group.name = 'ProceduralVest';

  const leather = new THREE.MeshPhysicalMaterial({
    color: 0xffffff,
    map: tex.map,
    roughness: 0.7,
    roughnessMap: tex.rough,
    bumpMap: tex.bump,
    bumpScale: high ? 0.75 : 0.6,
    alphaMap: tex.alpha,
    alphaTest: 0.5,
    clearcoat: 0.14,
    clearcoatRoughness: 0.55,
    sheen: 0.4,
    sheenRoughness: 0.6,
    sheenColor: new THREE.Color(0x2a2a2a),
    side: THREE.FrontSide,
  });
  const lining = new THREE.MeshStandardMaterial({
    color: 0x141418,
    roughness: 0.32,
    metalness: 0.15,
    alphaMap: tex.alpha,
    alphaTest: 0.5,
    side: THREE.BackSide,
  });
  const piping = new THREE.MeshPhysicalMaterial({
    color: 0x0a0a0a,
    roughness: 0.58,
    clearcoat: 0.12,
    clearcoatRoughness: 0.6,
  });
  const strapLeather = new THREE.MeshPhysicalMaterial({
    color: 0x080808,
    roughness: 0.6,
    bumpMap: tex.bump,
    bumpScale: 0.5,
    clearcoat: 0.15,
    side: THREE.DoubleSide,
  });
  const metal = new THREE.MeshStandardMaterial({ color: 0xc9cbcf, metalness: 1, roughness: 0.28 });
  const darkMetal = new THREE.MeshStandardMaterial({ color: 0x1b1b1d, metalness: 0.85, roughness: 0.35 });
  const tape = new THREE.MeshStandardMaterial({ color: 0x0b0b0b, roughness: 0.9, side: THREE.DoubleSide });

  const body = buildSurfaceGeometry(vestSurface, high ? 160 : 96, high ? 110 : 64);
  const outer = new THREE.Mesh(body, leather);
  const inner = new THREE.Mesh(body, lining);
  group.add(outer, inner);

  // Piping along hem, neckline and armholes
  const seg = high ? 220 : 120;
  const hem: [number, number][] = Array.from({ length: 81 }, (_, i) => [i / 80, 0.004]);
  group.add(tubeAlong(hem, 0.014, true, piping, seg));
  const neck: [number, number][] = Array.from({ length: 129 }, (_, i) => [i / 128, neckV(i / 128) - 0.002]);
  group.add(tubeAlong(neck, 0.013, true, piping, seg));
  for (const c of ARM_CENTERS) {
    const arm: [number, number][] = Array.from({ length: 64 }, (_, i) => armholePoint(c, i / 64));
    group.add(tubeAlong(arm, 0.013, true, piping, high ? 140 : 80));
  }

  // Central front zipper (u = 0) and two vertical pocket zippers
  const gunmetal = new THREE.MeshStandardMaterial({ color: 0x3c3d41, metalness: 1, roughness: 0.38 });
  const zipMats = { tape, teeth: darkMetal, metal: gunmetal };
  group.add(zipper(0, 0.012, neckV(0) - 0.004, zipMats, high ? 150 : 80));
  group.add(zipper(0.158, 0.1, 0.3, zipMats, high ? 40 : 24, 0.8));
  group.add(zipper(1 - 0.158, 0.1, 0.3, zipMats, high ? 40 : 24, 0.8));

  // Side straps (4 per side, like the reference)
  for (const [c, dir] of [
    [0.25, 1],
    [0.75, -1],
  ] as const) {
    for (const v of [0.08, 0.175, 0.27, 0.365]) group.add(sideStrap(c, v, dir, strapLeather, metal));
  }

  // Small brand-red woven label at the front hem
  const labelPos = surfacePoint(0.07, 0.05, 0.006);
  const label = new THREE.Mesh(
    new THREE.PlaneGeometry(0.06, 0.03),
    new THREE.MeshStandardMaterial({ color: 0xe32126, roughness: 0.8, emissive: 0x3a0506 }),
  );
  label.position.copy(labelPos);
  label.lookAt(labelPos.clone().add(surfaceNormal(vestSurface, 0.07, 0.05)));
  group.add(label);

  group.traverse((o) => {
    o.castShadow = false;
    o.receiveShadow = false;
  });
  return group;
}
