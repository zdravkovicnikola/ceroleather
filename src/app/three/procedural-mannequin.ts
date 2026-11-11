import * as THREE from 'three';
import { buildSurfaceGeometry, sampleKeyframes, spow, SurfaceFn } from './three-utils';

/**
 * PROCEDURAL PLACEHOLDER MANNEQUIN
 * A neutral tailor's dress form (upper body: hips → shoulders → neck) on a metal stand.
 * Meshes that measurements can be taken on are flagged with `userData.measurable = true`.
 * Replace with a GLB via THREE_ASSETS.mannequin.glbUrl.
 */

// [v, y, halfWidth, halfDepth]
const PROFILE: number[][] = [
  [0.0, -1.0, 0.68, 0.47],
  [0.1, -0.82, 0.7, 0.49],
  [0.24, -0.55, 0.68, 0.46],
  [0.34, -0.36, 0.665, 0.44],
  [0.46, -0.12, 0.69, 0.46],
  [0.6, 0.16, 0.77, 0.5],
  [0.72, 0.4, 0.82, 0.47],
  [0.8, 0.55, 0.85, 0.42],
  [0.86, 0.64, 0.76, 0.36],
  [0.91, 0.71, 0.5, 0.28],
  [0.95, 0.76, 0.26, 0.22],
  [1.0, 0.98, 0.205, 0.19],
];

const EXP = 2 / 2.3;
const gauss = (x: number, mu: number, s2: number) => Math.exp(-((x - mu) ** 2) / s2);

export const mannequinSurface: SurfaceFn = (u, v, target) => {
  const y = sampleKeyframes(PROFILE, v, 1);
  const a = sampleKeyframes(PROFILE, v, 2);
  const b = sampleKeyframes(PROFILE, v, 3);
  const th = u * Math.PI * 2;
  const s = Math.sin(th);
  const c = Math.cos(th);
  // chest in front, shoulder blades at the back
  const depth = c > 0 ? b * (1 + 0.07 * gauss(v, 0.62, 0.01)) : b * (1 + 0.05 * gauss(v, 0.72, 0.008));
  return target.set(a * spow(s, EXP), y, depth * spow(c, EXP));
};

function capAt(v: number, mat: THREE.Material, thickness: number, segments: number): THREE.Mesh {
  const a = sampleKeyframes(PROFILE, v, 2);
  const b = sampleKeyframes(PROFILE, v, 3);
  const y = sampleKeyframes(PROFILE, v, 1);
  const geo = new THREE.CylinderGeometry(1, 1, thickness, segments);
  const m = new THREE.Mesh(geo, mat);
  m.scale.set(a * 0.995, 1, b * 0.995);
  m.position.y = y;
  return m;
}

export function createProceduralMannequin(quality: 'high' | 'low'): THREE.Group {
  const high = quality === 'high';
  const g = new THREE.Group();
  g.name = 'ProceduralMannequin';

  const fabric = new THREE.MeshStandardMaterial({ color: 0xcdc8c0, roughness: 0.92, metalness: 0 });
  const seam = new THREE.MeshStandardMaterial({ color: 0x9e978d, roughness: 0.9 });
  const metal = new THREE.MeshStandardMaterial({ color: 0xb8bbc0, metalness: 1, roughness: 0.3 });
  const dark = new THREE.MeshStandardMaterial({ color: 0x1a1a1a, metalness: 0.6, roughness: 0.45 });

  const torso = new THREE.Mesh(buildSurfaceGeometry(mannequinSurface, high ? 128 : 72, high ? 96 : 56), fabric);
  torso.userData['measurable'] = true;
  torso.name = 'torso';
  g.add(torso);

  // Dress-form seam lines: centre front, centre back, sides
  for (const u of [0, 0.25, 0.5, 0.75]) {
    const pts: THREE.Vector3[] = [];
    for (let i = 0; i <= 40; i++) {
      const v = 0.01 + (0.97 * i) / 40;
      const p = mannequinSurface(u, v, new THREE.Vector3());
      p.multiplyScalar(1.003);
      p.y = sampleKeyframes(PROFILE, v, 1);
      pts.push(p);
    }
    g.add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 80, 0.0035, 4), seam));
  }

  // Bottom plate + neck cap
  g.add(capAt(0, dark, 0.03, 48));
  const neck = capAt(1, metal, 0.025, 40);
  neck.position.y += 0.012;
  g.add(neck);
  const knob = new THREE.Mesh(new THREE.SphereGeometry(0.05, 20, 12), metal);
  knob.position.y = 1.02;
  g.add(knob);

  // Stand
  const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.9, 16), metal);
  pole.position.y = -1.45;
  g.add(pole);
  const collar = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.08, 16), metal);
  collar.position.y = -1.08;
  g.add(collar);
  const base = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.46, 0.05, 48), dark);
  base.position.y = -1.9;
  g.add(base);

  return g;
}
