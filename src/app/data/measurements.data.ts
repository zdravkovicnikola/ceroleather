import { MeasurementDefinition } from '../models/measurement.model';

/**
 * UNIVERSAL MEASUREMENT DEFINITIONS
 * ---------------------------------
 * The measurement guide, the order form and the email are all generated from this list.
 *
 * ⚠ The texts and limits below are a reasonable starting point. Confirm the exact
 *   procedure with the workshop and simply edit the strings / numbers here.
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
    min: 70,
    max: 170,
    summary: 'Obim tela na najširem delu grudi, ispod pazuha i preko lopatica.',
    instructions: [
      'Malo podignite ruke u stranu i provucite traku oko tela, ispod pazuha.',
      'Postavite traku preko najisturenijeg dela grudi napred i preko lopatica pozadi.',
      'Traka mora biti vodoravna celom dužinom — proverite u ogledalu.',
      'Spustite ruke, normalno udahnite i očitajte meru. Traka naleže, ali ne steže.',
    ],
    tip: 'Između trake i tela treba da možete da provučete jedan prst.',
    tapePlacement: 'Traka ide vodoravno oko tela, preko najšireg dela grudi i lopatica.',
    guide3d: { kind: 'ring', heightRatio: 0.6 },
    camera: { azimuth: 0.5, elevation: 0.14, distance: 1, targetRatio: 0.58 },
    svg: { kind: 'ring', cx: 150, cy: 150, rx: 93, ry: 13 },
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
    guide3d: { kind: 'ring', heightRatio: 0.37 },
    camera: { azimuth: -0.5, elevation: 0.06, distance: 1, targetRatio: 0.42 },
    svg: { kind: 'ring', cx: 150, cy: 238, rx: 77, ry: 12 },
  },
];

export function measurementsFor(ids?: string[]): MeasurementDefinition[] {
  if (!ids?.length) return MEASUREMENTS;
  return MEASUREMENTS.filter((m) => ids.includes(m.id));
}
