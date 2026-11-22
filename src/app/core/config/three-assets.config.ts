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
   * Homepage hero — the new CeroLeather vest (Desktop/CeroLeather slike/NOVI DIZAJN/3d model v1.glb,
   * 59 MB: 1.78M triangles, 3 × 2048² JPEG textures). Served as Draco-compressed copies
   * (KHR_draco_mesh_compression, decoder self-hosted in assets/draco/) with WebP textures:
   *   desktop (v4): simplified to 60 % (1.07M triangles), textures WebP q92 → 4.64 MB
   *   mobile  (v4): simplified to 15 % (267k triangles),  textures WebP q85 → 1.82 MB
   * Draco default decode speed on purpose: the max-compression setting saves ~27 % more geometry
   * bytes but roughly doubles decode time, so total load time gets worse.
   * Previous build (backup): prsluk-3dmodel-v3*.glb — full geometry / 20 %, 6.70 MB / 2.47 MB.
   * Materials are used as authored: the roughness map already averages ≈ 0.49 (semi-matte
   * leather), so the old model's roughness-factor fix is not applied.
   * The file's front (zip) faces +Z, so no orientation fix is needed.
   * Backups (same settings as below): prsluk-3dmodel-v2*.glb (from "3d model.glb", same shape,
   * earlier textures). Original model: prsluk-3dmodel.webp.glb / prsluk-3dmodel-mobile.webp.glb
   * with rotationY: -Math.PI / 2, material: { roughnessFactor: 4.6, envMapIntensity: 0.5 }, no Draco.
   */
  heroVest: {
    glbUrl: 'assets/models/prsluk-3dmodel-v4.glb',
    glbUrlMobile: 'assets/models/prsluk-3dmodel-v4-mobile.glb',
    rotationY: 0,
    fallback: 'none',
    targetHeight: 2.0,
    material: { envMapIntensity: 0.5 },
    dracoDecoderPath: 'assets/draco/',
  } satisfies ModelAssetConfig as ModelAssetConfig,

  mannequin: {
    glbUrl: null,
    dracoDecoderPath: 'https://www.gstatic.com/draco/versioned/decoders/1.5.7/',
    targetHeight: 2.4,
  } satisfies ModelAssetConfig as ModelAssetConfig,
};
