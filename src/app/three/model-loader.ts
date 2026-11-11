import * as THREE from 'three';
import { ModelAssetConfig } from '../core/config/three-assets.config';

/**
 * ISOLATED ASSET LOADING
 * ----------------------
 * Loads a GLB/GLTF model if configured, otherwise (or on any error) returns the
 * procedural placeholder. The result is always centred on the origin and scaled
 * to `targetHeight`, so scenes never need to know which one they got.
 */
export interface LoadedModel {
  object: THREE.Object3D;
  source: 'glb' | 'procedural';
}

export async function loadModel(
  config: ModelAssetConfig,
  createPlaceholder: () => THREE.Object3D,
): Promise<LoadedModel> {
  if (config.glbUrl) {
    try {
      const object = await loadGlb(config);
      normalise(object, config.targetHeight);
      return { object, source: 'glb' };
    } catch (err) {
      console.warn('[CeroLeather] GLB model failed to load, using procedural placeholder.', err);
    }
  }
  const object = createPlaceholder();
  normalise(object, config.targetHeight);
  return { object, source: 'procedural' };
}

async function loadGlb(config: ModelAssetConfig): Promise<THREE.Object3D> {
  const { GLTFLoader } = await import('three/examples/jsm/loaders/GLTFLoader.js');
  const loader = new GLTFLoader();
  if (config.dracoDecoderPath) {
    const { DRACOLoader } = await import('three/examples/jsm/loaders/DRACOLoader.js');
    const draco = new DRACOLoader();
    draco.setDecoderPath(config.dracoDecoderPath);
    loader.setDRACOLoader(draco);
  }
  const gltf = await loader.loadAsync(config.glbUrl!);
  return gltf.scene;
}

/** Centre on origin (bounding box centre) and scale uniformly to the target height. */
function normalise(object: THREE.Object3D, targetHeight: number): void {
  const wrapper = new THREE.Box3().setFromObject(object);
  const size = wrapper.getSize(new THREE.Vector3());
  const center = wrapper.getCenter(new THREE.Vector3());
  const scale = size.y > 0 ? targetHeight / size.y : 1;
  object.position.sub(center.multiplyScalar(scale));
  object.scale.multiplyScalar(scale);
  object.updateMatrixWorld(true);
}
