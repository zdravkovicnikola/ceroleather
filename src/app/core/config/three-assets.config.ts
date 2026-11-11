/**
 * 3D asset configuration.
 *
 * Set `glbUrl` to a real model (placed in /public/assets/models/) to replace the
 * procedural placeholder meshes. If the file fails to load, the procedural
 * placeholder is used automatically, so the site never breaks.
 *
 * Model conventions (see README.md → "3D modeli"):
 *  - Y axis up, front of the garment / mannequin facing +Z.
 *  - Any scale: models are auto-normalised to the scene height.
 *  - Prefer Draco-compressed GLB, textures ≤ 2048px (1024px for mobile).
 */
export interface ModelAssetConfig {
  /** e.g. 'assets/models/vest.glb' — null = use procedural placeholder */
  glbUrl: string | null;
  /** Optional lighter copy (smaller textures, same geometry) for phones / low-tier devices */
  glbUrlMobile?: string | null;
  /**
   * Orientation fix applied on a PARENT group (the model itself is not modified), in radians
   * around Y — e.g. when the garment's front faces +X instead of +Z.
   */
  rotationY?: number;
  /**
   * What to show if the GLB fails: 'procedural' placeholder (default) or 'none' — then loading
   * rejects and the component shows its photographic fallback instead of an approximation.
   */
  fallback?: 'procedural' | 'none';
  /** Gentle material adjustments (factors only — textures and geometry stay untouched) */
  material?: {
    /**
     * glTF roughness FACTOR (multiplies the authored roughness map; the shader clamps the
     * result to 0.05–1). The map itself is not changed, so seams/stitching keep their variation.
     */
    roughnessFactor?: number;
    /** strength of environment reflections on this model */
    envMapIntensity?: number;
  };
  /** Optional Draco decoder path (only needed for Draco-compressed GLB files) */
  dracoDecoderPath?: string;
  /** Target height in scene units after normalisation */
  targetHeight: number;
}

export const THREE_ASSETS = {
  /**
   * Homepage hero — the real CeroLeather vest (Desktop/CeroLeather slike/prsluk-3dmodel.glb).
   * Mobile copy = same mesh/material, textures 2048² instead of 4096² (16 MB → 5.5 MB).
   * The file's front (zip) faces +X, so it is turned -90° around Y on a parent group.
   */
  heroVest: {
    glbUrl: 'assets/models/prsluk-3dmodel.glb',
    glbUrlMobile: 'assets/models/prsluk-3dmodel-mobile.glb',
    rotationY: -Math.PI / 2,
    fallback: 'none',
    targetHeight: 2.0,
    // The file's roughness map averages 0.11 × factor 0.5 ≈ 0.05 (mirror-like, reads as latex).
    // Factor 4.6 → mean ≈ 0.5: semi-matte black leather, highlights stay on seams and folds.
    material: { roughnessFactor: 4.6, envMapIntensity: 0.5 },
  } satisfies ModelAssetConfig as ModelAssetConfig,

  mannequin: {
    glbUrl: null,
    dracoDecoderPath: 'https://www.gstatic.com/draco/versioned/decoders/1.5.7/',
    targetHeight: 2.4,
  } satisfies ModelAssetConfig as ModelAssetConfig,
};
