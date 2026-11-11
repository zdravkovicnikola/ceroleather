import * as THREE from 'three';
import { ModelAssetConfig } from '../core/config/three-assets.config';

/**
 * ISOLATED ASSET LOADING
 * ----------------------
 * Loads a GLB/GLTF model if configured. The loaded scene is placed inside a wrapper group
 * that carries the orientation fix, centring and scaling — the model's own nodes, geometry
 * and textures are never modified — so scenes can animate the wrapper's parents freely.
 *
 * On error: returns the procedural placeholder (config.fallback = 'procedural', default) or
 * rejects (config.fallback = 'none'), so the caller can show a photo instead.
 */
export interface LoadedModel {
  object: THREE.Object3D;
  source: 'glb' | 'procedural';
  /** URL that was actually loaded (desktop or mobile variant) */
  url?: string;
}

export interface LoadModelOptions {
  /** use `glbUrlMobile` when available (phones, low-tier GPUs) */
  preferMobile?: boolean;
  /** download progress 0–1 (only when the server sends Content-Length) */
  onProgress?: (fraction: number) => void;
}

export async function loadModel(
  config: ModelAssetConfig,
  createPlaceholder: () => THREE.Object3D,
  options: LoadModelOptions = {},
): Promise<LoadedModel> {
  const url = (options.preferMobile && config.glbUrlMobile) || config.glbUrl;
  if (url) {
    try {
      const gltfScene = await loadGlb(url, config, options.onProgress);
      tuneMaterials(gltfScene, config);
      const object = wrap(gltfScene, config.rotationY ?? 0);
      normalise(object, config.targetHeight);
      return { object, source: 'glb', url };
    } catch (err) {
      if (config.fallback === 'none') throw err;
      console.warn('[CeroLeather] GLB model failed to load, using procedural placeholder.', err);
    }
  }
  if (config.fallback === 'none') throw new Error('No 3D model configured');
  const object = createPlaceholder();
  normalise(object, config.targetHeight);
  return { object, source: 'procedural' };
}

async function loadGlb(
  url: string,
  config: ModelAssetConfig,
  onProgress?: (fraction: number) => void,
): Promise<THREE.Object3D> {
  const { GLTFLoader } = await import('three/examples/jsm/loaders/GLTFLoader.js');
  const loader = new GLTFLoader();
  if (config.dracoDecoderPath) {
    const { DRACOLoader } = await import('three/examples/jsm/loaders/DRACOLoader.js');
    const draco = new DRACOLoader();
    draco.setDecoderPath(config.dracoDecoderPath);
    loader.setDRACOLoader(draco);
  }
  const gltf = await loader.loadAsync(url, (e) => {
    if (e.lengthComputable && e.total) onProgress?.(e.loaded / e.total);
  });
  return gltf.scene;
}

/** Orientation fix on a parent group — never on the model's own nodes. */
function wrap(model: THREE.Object3D, rotationY: number): THREE.Object3D {
  const orient = new THREE.Group();
  orient.name = 'model-orientation';
  orient.rotation.y = rotationY;
  orient.add(model);
  const wrapper = new THREE.Group();
  wrapper.name = 'model-wrapper';
  wrapper.add(orient);
  return wrapper;
}

/** Factor-only tweaks (e.g. less gloss on black leather). Textures stay as authored. */
function tuneMaterials(root: THREE.Object3D, config: ModelAssetConfig): void {
  const t = config.material;
  root.traverse((o) => {
    const mesh = o as THREE.Mesh;
    if (!mesh.isMesh) return;
    const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
    for (const m of mats) {
      const std = m as THREE.MeshStandardMaterial;
      if (!std.isMeshStandardMaterial) continue;
      if (t?.roughnessFactor !== undefined) std.roughness = t.roughnessFactor;
      if (t?.envMapIntensity !== undefined) std.envMapIntensity = t.envMapIntensity;
      // highest-quality sampling of the authored textures at grazing angles
      for (const tex of [std.map, std.normalMap, std.roughnessMap, std.metalnessMap])
        if (tex) tex.anisotropy = 8;
      std.needsUpdate = true;
    }
  });
}

/** Centre on origin (bounding box centre) and scale uniformly to the target height. */
function normalise(object: THREE.Object3D, targetHeight: number): void {
  object.updateMatrixWorld(true);
  const box = new THREE.Box3().setFromObject(object);
  const size = box.getSize(new THREE.Vector3());
  const center = box.getCenter(new THREE.Vector3());
  const scale = size.y > 0 ? targetHeight / size.y : 1;
  object.position.sub(center.multiplyScalar(scale));
  object.scale.multiplyScalar(scale);
  object.updateMatrixWorld(true);
}
