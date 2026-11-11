import * as THREE from 'three';

/** Recursively dispose geometries, materials and textures of an object tree. */
export function disposeObject(root: THREE.Object3D): void {
  const textures = new Set<THREE.Texture>();
  root.traverse((obj) => {
    const mesh = obj as THREE.Mesh;
    mesh.geometry?.dispose();
    const mats = Array.isArray(mesh.material) ? mesh.material : mesh.material ? [mesh.material] : [];
    for (const m of mats) {
      for (const value of Object.values(m)) if (value instanceof THREE.Texture) textures.add(value);
      m.dispose();
    }
  });
  textures.forEach((t) => t.dispose());
}

/** Smooth Catmull-Rom interpolation over keyframes [[x, ...values]] sorted by x. */
export function sampleKeyframes(frames: number[][], x: number, index: number): number {
  const n = frames.length;
  if (x <= frames[0][0]) return frames[0][index];
  if (x >= frames[n - 1][0]) return frames[n - 1][index];
  let i = 0;
  while (i < n - 2 && x > frames[i + 1][0]) i++;
  const x0 = frames[i][0];
  const x1 = frames[i + 1][0];
  const t = (x - x0) / (x1 - x0);
  const p0 = frames[Math.max(0, i - 1)][index];
  const p1 = frames[i][index];
  const p2 = frames[i + 1][index];
  const p3 = frames[Math.min(n - 1, i + 2)][index];
  const t2 = t * t;
  const t3 = t2 * t;
  return 0.5 * (2 * p1 + (-p0 + p2) * t + (2 * p0 - 5 * p1 + 4 * p2 - p3) * t2 + (-p0 + 3 * p1 - 3 * p2 + p3) * t3);
}

/** Signed power — keeps the sign, used for superellipse cross-sections. */
export function spow(v: number, e: number): number {
  return Math.sign(v) * Math.pow(Math.abs(v), e);
}

export type SurfaceFn = (u: number, v: number, target: THREE.Vector3) => THREE.Vector3;

/** Outward normal of a parametric surface by finite differences. */
export function surfaceNormal(fn: SurfaceFn, u: number, v: number, target = new THREE.Vector3()): THREE.Vector3 {
  const e = 1e-3;
  const p = fn(u, v, new THREE.Vector3());
  const du = fn(u + e, v, new THREE.Vector3()).sub(fn(u - e, v, new THREE.Vector3()));
  const dv = fn(u, Math.min(1, v + e), new THREE.Vector3()).sub(fn(u, Math.max(0, v - e), new THREE.Vector3()));
  target.crossVectors(du, dv).normalize();
  const radial = new THREE.Vector3(p.x, 0, p.z);
  if (target.dot(radial) < 0) target.negate();
  return target;
}

/** Build an indexed grid geometry for a parametric surface (u wraps around). */
export function buildSurfaceGeometry(fn: SurfaceFn, segU: number, segV: number): THREE.BufferGeometry {
  const positions: number[] = [];
  const uvs: number[] = [];
  const indices: number[] = [];
  const p = new THREE.Vector3();
  for (let j = 0; j <= segV; j++) {
    const v = j / segV;
    for (let i = 0; i <= segU; i++) {
      const u = i / segU;
      fn(u, v, p);
      positions.push(p.x, p.y, p.z);
      uvs.push(u, v);
    }
  }
  const row = segU + 1;
  for (let j = 0; j < segV; j++) {
    for (let i = 0; i < segU; i++) {
      const a = j * row + i;
      const b = a + 1;
      const c = a + row;
      const d = c + 1;
      indices.push(a, b, d, a, d, c);
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  g.setIndex(indices);
  g.computeVertexNormals();
  // Make sure normals point outward (winding depends on parametrisation).
  const n = new THREE.Vector3();
  const mid = Math.floor(segV / 2) * row + Math.floor(segU / 8);
  n.fromBufferAttribute(g.getAttribute('normal') as THREE.BufferAttribute, mid);
  p.fromBufferAttribute(g.getAttribute('position') as THREE.BufferAttribute, mid);
  if (n.dot(new THREE.Vector3(p.x, 0, p.z)) < 0) {
    const idx = g.getIndex()!;
    for (let k = 0; k < idx.count; k += 3) {
      const t = idx.getX(k + 1);
      idx.setX(k + 1, idx.getX(k + 2));
      idx.setX(k + 2, t);
    }
    g.computeVertexNormals();
  }
  return g;
}

/**
 * Flat ribbon along a polyline. `sides[i]` is the in-plane width direction at point i.
 * UV.x runs along the length (0..length in world units), UV.y across (0..1).
 * Indices are ordered from start to end so drawRange can "draw" the ribbon progressively.
 */
export function buildRibbon(
  points: THREE.Vector3[],
  sides: THREE.Vector3[],
  normals: THREE.Vector3[],
  width: number,
  lift = 0.004,
): { geometry: THREE.BufferGeometry; length: number } {
  const pos: number[] = [];
  const nor: number[] = [];
  const uv: number[] = [];
  const idx: number[] = [];
  let len = 0;
  const a = new THREE.Vector3();
  for (let i = 0; i < points.length; i++) {
    if (i > 0) len += points[i].distanceTo(points[i - 1]);
    const p = points[i];
    const s = sides[i];
    const n = normals[i];
    for (const k of [-0.5, 0.5]) {
      a.copy(p).addScaledVector(s, k * width).addScaledVector(n, lift);
      pos.push(a.x, a.y, a.z);
      nor.push(n.x, n.y, n.z);
      uv.push(len, k + 0.5);
    }
    if (i > 0) {
      const b = (i - 1) * 2;
      idx.push(b, b + 1, b + 3, b, b + 3, b + 2);
    }
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  geometry.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3));
  geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  geometry.setIndex(idx);
  return { geometry, length: len };
}

/** Soft radial shadow texture for a fake contact shadow plane. */
export function radialShadowTexture(size = 256): THREE.CanvasTexture {
  const c = document.createElement('canvas');
  c.width = c.height = size;
  const ctx = c.getContext('2d')!;
  const g = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  g.addColorStop(0, 'rgba(0,0,0,0.85)');
  g.addColorStop(0.45, 'rgba(0,0,0,0.45)');
  g.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, size, size);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

/** Round soft dot sprite texture (for dust particles / glow markers). */
export function dotTexture(size = 64): THREE.CanvasTexture {
  const c = document.createElement('canvas');
  c.width = c.height = size;
  const ctx = c.getContext('2d')!;
  const g = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  g.addColorStop(0, 'rgba(255,255,255,1)');
  g.addColorStop(0.3, 'rgba(255,255,255,0.6)');
  g.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, size, size);
  return new THREE.CanvasTexture(c);
}
