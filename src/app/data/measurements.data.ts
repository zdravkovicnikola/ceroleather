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
    guide3d: { kind: 'ring', heightRatio: 0.44 },
    camera: { azimuth: 0.5, elevation: 0.12, distance: 1, targetRatio: 0.48 },
    svg: { kind: 'ring', cx: 150, cy: 205, rx: 77, ry: 12 },
  },
  {
    id: 'abdomen',
    label: 'Obim stomaka',
    emailParam: 'abdomen_cm',
    unit: 'cm',
    required: true,
    min: 60,
    max: 170,
    summary: 'Obim tela u predelu stomaka, u visini pupka.',
    instructions: [
      'Pronađite visinu pupka — tu je obično najširi deo stomaka.',
      'Obmotajte traku oko tela, vodoravno, u toj visini.',
      'Stojte opušteno i ne uvlačite stomak.',
      'Očitajte meru posle normalnog izdisaja.',
    ],
    tip: 'Ako želite slobodniji kroj za vožnju u sedećem položaju, napišite to u napomeni.',
    tapePlacement: 'Traka ide vodoravno oko stomaka, u visini pupka.',
    formHint: 'Najširi deo stomaka, u visini pupka.',
    guide3d: { kind: 'ring', heightRatio: 0.3 },
    camera: { azimuth: -0.5, elevation: 0.06, distance: 1, targetRatio: 0.36 },
    svg: { kind: 'ring', cx: 150, cy: 256, rx: 76, ry: 12 },
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
