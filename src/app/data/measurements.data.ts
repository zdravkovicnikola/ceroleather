import { MeasurementDefinition } from '../models/measurement.model';

/**
 * UNIVERSAL MEASUREMENT DEFINITIONS
 * ---------------------------------
 * The measurement guide, the order form and the email are all generated from this list.
 *
 * ⚠ The texts and limits below are a reasonable starting point. Confirm the exact
 *   procedure with the workshop and simply edit the strings / numbers here.
 *
 * Measurements without `guide3d`/`svg` (e.g. body height) appear in the guide and the form,
 * but no tape is drawn on the mannequin.
 *
 * To add a measurement (e.g. "Širina ramena"):
 *   - add an object with a new `id` and `emailParam`
 *   - pick a `guide3d` (ring at a height, or a vertical line) and an `svg` fallback
 *   - add {{<emailParam>}} to your EmailJS template (or rely on {{measurements_summary}})
 */
export const MEASUREMENTS: MeasurementDefinition[] = [
  {
    id: 'vestLength',
    label: 'Dužina prsluka',
    emailParam: 'vest_length_cm',
    unit: 'cm',
    required: true,
    min: 35,
    max: 100,
    summary:
      'Dužina od najviše tačke ramena, tik uz vrat, preko grudi do mesta gde želite da prsluk završi.',
    instructions: [
      'Stanite uspravno, opuštenih ramena, u majici koju biste nosili ispod prsluka.',
      'Početak trake postavite na najvišu tačku ramena, tik uz vrat.',
      'Spustite traku pravo naniže, preko grudi, bez zatezanja.',
      'Završite na visini na kojoj želite da prsluk završi — na primer u visini kaiša.',
    ],
    tip: 'Zamolite nekoga da vas izmeri. Kada merite sami, rame se podigne i mera nije tačna.',
    tapePlacement: 'Traka ide vertikalno: od ramena uz vrat, preko grudi, do željenog donjeg ruba.',
    guide3d: { kind: 'vertical', angle: 0.42, fromRatio: 0.875, toRatio: 0.12 },
    camera: { azimuth: 0.85, elevation: 0.12, distance: 1.12, targetRatio: 0.5 },
    svg: { kind: 'vertical', x1: 131, y1: 66, x2: 119, y2: 318 },
  },
  {
    id: 'chest',
    label: 'Obim grudi',
    emailParam: 'chest_cm',
    unit: 'cm',
    required: true,
    min: 60,
    max: 180,
    summary: 'Obim tela preko najširog dela grudi, ispod pazuha.',
    instructions: [
      'Stanite uspravno i opustite ruke pored tela.',
      'Provucite traku ispod pazuha i obmotajte je oko grudi, preko najširog dela.',
      'Traka treba da bude vodoravna — napred i na leđima, preko lopatica.',
      'Dišite normalno i očitajte meru posle izdisaja.',
    ],
    tip: 'Merite preko majice koju biste nosili ispod prsluka. Traka treba da naleže, ali ne da steže.',
    tapePlacement: 'Traka ide vodoravno oko grudi, ispod pazuha, preko najširog dela.',
    formHint: 'Najširi deo grudi, ispod pazuha.',
    guide3d: { kind: 'ring', heightRatio: 0.66 },
    camera: { azimuth: -0.35, elevation: 0.14, distance: 1, targetRatio: 0.6 },
    svg: { kind: 'ring', cx: 150, cy: 142, rx: 91, ry: 13 },
  },
  {
    id: 'waist',
    label: 'Obim struka',
    emailParam: 'waist_cm',
    unit: 'cm',
    required: true,
    min: 55,
    max: 170,
    summary: 'Obim tela na najužem delu trupa — obično nekoliko centimetara iznad pupka.',
    instructions: [
      'Stanite uspravno i opustite ruke pored tela.',
      'Pronađite najuži deo trupa, između donjih rebara i pupka.',
      'Obmotajte traku vodoravno oko tela na toj visini.',
      'Ne uvlačite stomak — očitajte meru posle normalnog izdisaja.',
    ],
    tip: 'Traka treba da naleže na telo, ali da ga ne steže. Merite preko tanke majice.',
    tapePlacement: 'Traka ide vodoravno oko tela, na najužem delu trupa (iznad pupka).',
    formHint: 'Najuži deo trupa, iznad pupka.',
    guide3d: { kind: 'ring', heightRatio: 0.33 },
    camera: { azimuth: 0.4, elevation: 0.16, distance: 1, targetRatio: 0.38 },
    svg: { kind: 'ring', cx: 150, cy: 246, rx: 74, ry: 11 },
  },
  {
    id: 'height',
    label: 'Visina osobe',
    emailParam: 'height_cm',
    unit: 'cm',
    required: false,
    approximate: true,
    min: 140,
    max: 220,
    summary: 'Vaša okvirna visina — pomaže nam da proverimo proporcije kroja. Nije obavezno.',
    instructions: [
      'Dovoljna je okvirna vrednost, na primer iz lične karte ili sa poslednjeg merenja.',
      'Ako merite: stanite bosi uz zid, ispravljenih leđa, i izmerite od poda do temena.',
    ],
    tapePlacement: 'Ne meri se na prsluku — unesite svoju visinu bez obuće.',
    formHint: 'Opciono — okvirna visina bez obuće.',
    camera: { azimuth: 0.35, elevation: 0.1, distance: 1.25, targetRatio: 0.5 },
  },
];

export function measurementsFor(ids?: string[]): MeasurementDefinition[] {
  if (!ids?.length) return MEASUREMENTS;
  return MEASUREMENTS.filter((m) => ids.includes(m.id));
}
