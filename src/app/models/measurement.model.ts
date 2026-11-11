/**
 * A measurement definition is UNIVERSAL — it is not tied to a specific product.
 * Products only reference measurement ids. Everything the guide renders
 * (text, 3D indicator, SVG fallback, validation) comes from this definition.
 */

/** Horizontal ring around the body at a given height of the mannequin. */
export interface RingGuide {
  kind: 'ring';
  /** 0 = bottom of the mannequin torso, 1 = top of the neck */
  heightRatio: number;
}

/** Vertical tape along the body surface. */
export interface VerticalGuide {
  kind: 'vertical';
  /** Angle around the body in radians. 0 = centre front, positive = wearer's left */
  angle: number;
  fromRatio: number;
  toRatio: number;
}

export type Guide3D = RingGuide | VerticalGuide;

export interface GuideCamera {
  /** Horizontal orbit angle in radians (0 = looking at the front) */
  azimuth: number;
  /** Vertical orbit angle in radians (positive = from above) */
  elevation: number;
  /** Distance multiplier (1 = default framing) */
  distance: number;
  /** Look-at height as ratio of the mannequin height */
  targetRatio: number;
}

/** SVG fallback overlay, in the 0..300 × 0..400 viewBox of the fallback figure */
export type GuideSvg =
  | { kind: 'ring'; cx: number; cy: number; rx: number; ry: number }
  | { kind: 'vertical'; x1: number; y1: number; x2: number; y2: number };

export interface MeasurementDefinition {
  /** Stable id — also used as the form control name and EmailJS param base */
  id: string;
  /** Display label, e.g. "DUŽINA PRSLUKA" */
  label: string;
  /** EmailJS template variable for this value, e.g. "vest_length_cm" */
  emailParam: string;
  unit: 'cm';
  required: boolean;
  /** Value is only approximate (shown as "okvirno") */
  approximate?: boolean;
  min: number;
  max: number;
  /** One-sentence explanation */
  summary: string;
  /** Ordered "how to measure" steps */
  instructions: string[];
  /** Short practical tip */
  tip?: string;
  /** Description of where the tape goes (shown with the visual example) */
  tapePlacement: string;
  /** Short helper shown under the field in the order form */
  formHint?: string;
  /** Tape on the 3D mannequin. Omit for values that are not measured on the torso (e.g. body height). */
  guide3d?: Guide3D;
  camera: GuideCamera;
  /** SVG fallback overlay. Omit together with `guide3d`. */
  svg?: GuideSvg;
}

export type MeasurementValues = Record<string, number | null>;
