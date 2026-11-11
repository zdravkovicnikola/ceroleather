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
  /** Optional Draco decoder path (only needed for Draco-compressed GLB files) */
  dracoDecoderPath?: string;
  /** Target height in scene units after normalisation */
  targetHeight: number;
}

export const THREE_ASSETS = {
  heroVest: {
    glbUrl: null,
    dracoDecoderPath: 'https://www.gstatic.com/draco/versioned/decoders/1.5.7/',
    targetHeight: 2.0,
  } satisfies ModelAssetConfig as ModelAssetConfig,

  mannequin: {
    glbUrl: null,
    dracoDecoderPath: 'https://www.gstatic.com/draco/versioned/decoders/1.5.7/',
    targetHeight: 2.4,
  } satisfies ModelAssetConfig as ModelAssetConfig,
};
