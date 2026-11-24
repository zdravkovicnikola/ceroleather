import { Product, ProductImage, ProductImageKind } from '../models/product.model';

/**
 * CENTRAL PRODUCT DATA
 * --------------------
 * Add a new model by adding an object to PRODUCTS. No UI changes are needed.
 *
 *  1. Put images in /public/assets/images/products/  (WebP, ~1600px + ~760px "-sm" version)
 *  2. Add an entry below. `slug` becomes the URL: /katalog/<slug>
 *  3. `features` must contain only details that are real and confirmed.
 *  4. `price` is optional and only shown when SITE_CONFIG.showPrices = true.
 *
 * Model names below are working names — replace them with the workshop's official names.
 */

const BASE = 'assets/images/products/';

function img(file: string, kind: ProductImageKind, alt: string, caption?: string): ProductImage {
  return { src: `${BASE}${file}.webp`, srcSm: `${BASE}${file}-sm.webp`, kind, alt, caption };
}

/**
 * Main (first) catalog image: the client's cut-outs, assets/images/products/main/.
 * `cutout: false` for a main image that is not transparent (currently none — all nine are cut-outs).
 */
function main(file: string, name: string, cutout = true): ProductImage {
  return { ...img(`main/${file}`, 'front', `Kožni prsluk ${name} — prednja strana`), cutout };
}

/*
 * CATALOG — client list, Nov 2026 (order = display order).
 * Renamed products keep their original slugs so existing links keep working:
 *   prsluk-strap = Harly Model, prsluk-rider = Rokerica, prsluk-lace = Sinovi Anarhije,
 *   prsluk-classic-zip = Euro Cut, prsluk-protect = Protect – Limited Edition, prsluk-buckle = Shadow.
 * Removed from the catalog: Cherry, Blush, SWAT (their images stay in assets/images/products/).
 * Descriptions: the client's texts (Nov 2026). The first sentence is `shortDescription` (card +
 * product-page lead), the rest is `description`; `featuresTitle` + `features` = "Zašto se … izdvaja".
 * Galleries are unchanged (next phase).
 * To reclassify a product, change only its `category` — nothing else depends on it.
 */
export const PRODUCTS: Product[] = [
  // 1. HARLY MODEL
  {
    slug: 'prsluk-strap',
    name: 'Harly Model',
    category: 'muski',
    price: { amount: 7500 },
    featured: true,
    shortDescription:
      'Harly je muški moto-prsluk izrađen od kvalitetne teleće kože.',
    description: [
      'Bočni kaiševi za dodatno proširenje omogućavaju prilagođavanje širine, pa ga možeš nositi preko majice ili moto-jakne.',
    ],
    featuresTitle: 'Zašto se Harly izdvaja',
    features: [
      'Kvalitetna teleća koža: čvrsta i pouzdana, namenjena dugotrajnoj upotrebi.',
      'Bočni kaiševi za proširenje: omogućavaju prilagođavanje širine i udobno nošenje preko moto-jakne.',
      'Klasičan moto-dizajn: upečatljiv izgled koji nikada ne izlazi iz mode.',
      'Crna postava: sa praktičnim unutrašnjim džepom.',
    ],
    images: [
      main('harly', 'Harly Model'),
      img('strap-vest-side', 'side', 'Crni kožni prsluk Harly Model — bočna strana sa podesivim trakama'),
      img(
        'strap-vest-front-open',
        'open',
        'Prsluk Harly Model — otvoren, vidi se postava i unutrašnji džep',
      ),
      img(
        'strap-vest-detail-straps',
        'detail',
        'Detalj bočnih kožnih traka sa kopčama',
        'Bočne trake',
      ),
      img(
        'strap-vest-detail-shoulder',
        'detail',
        'Detalj prošivenog ramenog panela',
        'Rameni panel',
      ),
      img(
        'strap-vest-detail-pocket',
        'detail',
        'Unutrašnji džep sa rajsferšlusom',
        'Unutrašnji džep',
      ),
      img('strap-vest-detail-grain', 'detail', 'Tekstura zrnaste kože izbliza', 'Tekstura kože'),
    ],
  },
  // 2. KOSMAJ MODEL
  {
    slug: 'prsluk-kosmaj',
    name: 'Kosmaj Model',
    category: 'muski',
    price: { amount: 7500 },
    shortDescription:
      'Kosmaj je čvrst moto-prsluk od teleće kože, napravljen za duge kilometre i ljubitelje klasičnog moto-stila.',
    description: [
      'Zahvaljujući bočnim kaiševima za dodatno proširenje, lako se prilagođava i omogućava nošenje preko moto-jakne.',
    ],
    featuresTitle: 'Zašto se Kosmaj izdvaja',
    features: [
      'Teleća koža: čvrsta, pouzdana i izdržljiva.',
      'Prilagodljivost: bočni kaiševi omogućavaju proširenje i prilagođavanje širine.',
      'Klasičan moto-dizajn: upečatljiv izgled pogodan za različite stilove.',
      'Crna postava: sa unutrašnjim džepom.',
    ],
    images: [
      main('kosmaj', 'Kosmaj Model'),
      img('kosmaj/front', 'front', 'Crni kožni prsluk Kosmaj Model — prednja strana, zakopčan'),
      img(
        'kosmaj/open',
        'open',
        'Prsluk Kosmaj Model — otkopčan, vidi se crno-bela postava na kocke',
        'Postava na kocke',
      ),
      img(
        'kosmaj/detail-side-straps',
        'detail',
        'Bočne kožne trake sa metalnim kopčama',
        'Bočne trake',
      ),
      img('kosmaj/detail-shoulder', 'detail', 'Romboidno prošiven rameni panel', 'Rameni panel'),
      img(
        'kosmaj/detail-lining',
        'detail',
        'Crno-bela postava na kocke i džep sa rajsferšlusom',
        'Postava izbliza',
      ),
    ],
  },
  // 3. DALMACIJA – V IZRAZ
  {
    slug: 'prsluk-dalmacija',
    name: 'Dalmacija – V izraz',
    category: 'muski',
    price: { amount: 7500 },
    shortDescription:
      'Dalmacija je moto-prsluk sa V-izrezom koji spaja klasičan kroj i moderan izgled.',
    description: [
      'Izrađen je od teleće kože i namenjen dugim vožnjama. Bočni kaiševi za dodatno proširenje omogućavaju prilagođavanje širine i nošenje preko moto-jakne.',
    ],
    featuresTitle: 'Zašto se Dalmacija izdvaja',
    features: [
      'Teleća koža: čvrsta i pouzdana, namenjena dugotrajnoj upotrebi.',
      'V-izrez: klasičan kroj koji prsluku daje prepoznatljiv izgled.',
      'Bočni kaiševi za proširenje: omogućavaju prilagođavanje širine i nošenje preko moto-jakne.',
      'Crna postava: sa unutrašnjim džepom.',
    ],
    images: [main('dalmacija', 'Dalmacija – V izraz')],
  },
  // 4. ROKERICA
  {
    slug: 'prsluk-rider',
    name: 'Rokerica',
    category: 'zenski',
    price: { amount: 9000 },
    shortDescription:
      'Rokerica je ženski kožni moto-prsluk sa kragnom na drikere, koso postavljenim rajsferšlusom i kosim prednjim džepovima.',
    description: [
      'Spoj upečatljivog kroja i klasičnog moto-stila.',
    ],
    features: [],
    images: [
      main('rokerica', 'Rokerica'),
      img('rider-vest-front-open', 'open', 'Kožni prsluk Rokerica — otvoren, vidi se postava'),
      img('rider-vest-detail-collar', 'detail', 'Kragna sa metalnim drikerima', 'Kragna'),
      img('rider-vest-detail-tag', 'detail', 'CeroLeather etiketa', 'Etiketa'),
      img('rider-vest-detail-pocket', 'detail', 'Kosi džep sa metalnim rajsferšlusom', 'Kosi džep'),
    ],
  },
  // 5. SINOVI ANARHIJE
  {
    slug: 'prsluk-lace',
    name: 'Sinovi Anarhije',
    category: 'muski',
    price: { amount: 13000, amountMax: 14000 },
    featured: true,
    shortDescription:
      'Sinovi Anarhije je prepoznatljiv moto-prsluk od teleće kože, stvoren za ljubitelje autentičnog moto-stila.',
    description: [
      'Bočni rajsferšlusi omogućavaju dodatno proširenje i prilagođavanje širine za nošenje preko moto-jakne. Posebno praktičan detalj predstavlja unutrašnji džep kojem možeš pristupiti čak i kada je prsluk zakopčan.',
    ],
    featuresTitle: 'Zašto se Sinovi Anarhije izdvaja',
    features: [
      'Praktičan unutrašnji džep: omogućava pristup stvarima čak i kada je prsluk zakopčan.',
      'Bočni rajsferšlusi za proširenje: omogućavaju jednostavno prilagođavanje širine.',
      'Prepoznatljiv moto-izgled: kragna, džepovi i površina pogodna za postavljanje prišivača.',
      'Premium teleća koža: kvalitetan materijal za dugotrajnu upotrebu.',
      'Crna postava: sa unutrašnjim džepom.',
    ],
    images: [
      main('sinovi-anarhije', 'Sinovi Anarhije'),
      img('lace-vest-front', 'front', 'Kožni prsluk Sinovi Anarhije sa bočnim vezivanjem'),
      img(
        'lace-vest-detail-lacing',
        'detail',
        'Detalj bočnog vezivanja kožnom pertlom',
        'Bočno vezivanje',
      ),
      img('lace-vest-detail-tag', 'detail', 'CeroLeather etiketa', 'Etiketa'),
      img('lace-vest-detail-collar', 'detail', 'Revers kragna prsluka Sinovi Anarhije', 'Revers kragna'),
    ],
  },
  // 6. NORDKAPP
  {
    slug: 'prsluk-nordkapp',
    name: 'Nordkapp',
    category: 'muski',
    price: { amount: 13000, amountMax: 14000 },
    shortDescription:
      'Nordkapp je moto-prsluk od teleće kože, osmišljen za duge vožnje i ljubitelje upečatljivog dizajna.',
    description: [
      'Kombinuje proštepane kožne detalje, praktičan raspored džepova i bočne kaiševe koji omogućavaju prilagođavanje širine prsluka.',
    ],
    featuresTitle: 'Zašto se Nordkapp izdvaja',
    features: [
      'Upečatljiv dizajn i štep: proštepani delovi kože daju prsluku poseban vizuelni identitet.',
      'Praktičan raspored džepova: prednji džepovi na grudima i donjem delu, sa rajsferšlusima za sigurno odlaganje stvari.',
      'Bočni kaiševi za sužavanje: omogućavaju prilagođavanje prsluka, naročito kada se nosi preko majice.',
      'Premium teleća koža: kvalitetan i izdržljiv materijal.',
      'Crna postava: sa unutrašnjim džepom.',
    ],
    images: [main('nordkapp', 'Nordkapp')],
  },
  // 7. EURO CUT
  {
    slug: 'prsluk-classic-zip',
    name: 'Euro Cut',
    category: 'muski',
    price: { amount: 10000 },
    featured: true,
    shortDescription:
      'Euro Cut je kraći kožni moto-prsluk inspirisan prepoznatljivim evropskim stilom.',
    description: [
      'Odlikuju ga minimalistički izgled, okrugli izrez i jednostavne linije bez suvišnih detalja. Izrađen je od teleće kože, dok bočni rajsferšlusi omogućavaju dodatno proširenje i prilagođavanje širine za nošenje preko moto-jakne.',
    ],
    featuresTitle: 'Zašto se Euro Cut izdvaja',
    features: [
      'Evropski kroj: kraći model sa okruglim izrezom i minimalističkim izgledom.',
      'Bočni rajsferšlusi za proširenje: omogućavaju brzo i jednostavno prilagođavanje širine.',
      'Premium teleća koža: kvalitetan materijal namenjen dugotrajnoj upotrebi.',
      'Crna postava: sa unutrašnjim džepom.',
    ],
    images: [
      main('euro-cut', 'Euro Cut'),
      img('zip-vest-front', 'front', 'Kožni prsluk Euro Cut — prednja strana'),
      img('zip-vest-back', 'back', 'Kožni prsluk Euro Cut — zadnja strana'),
      img(
        'zip-vest-detail-collar',
        'detail',
        'Okrugli izrez i centralni rajsferšlus prsluka Euro Cut',
        'Izrez i rajsferšlus',
      ),
      img(
        'zip-vest-detail-back-seams',
        'detail',
        'Panelni kroj na leđima prsluka Euro Cut',
        'Kroj leđa',
      ),
    ],
  },
  // 8. PROTECT – LIMITED EDITION
  {
    slug: 'prsluk-protect',
    name: 'Protect – Limited Edition',
    category: 'muski',
    price: { amount: 9500 },
    shortDescription:
      'Protect – Limited Edition je kožni moto-prsluk sa EVO penom, namenjen vozačima koji žele dodatne karakteristike u prepoznatljivom moto-dizajnu.',
    description: [
      'Bočni kaiševi omogućavaju dodatno proširenje i prilagođavanje širine, kao i nošenje preko moto-jakne.',
    ],
    features: [],
    images: [
      main('protect', 'Protect – Limited Edition'),
      img('protect/front', 'front', 'Kožni prsluk Protect – Limited Edition — prednja strana sa prošivenim panelom'),
      img('protect/back', 'back', 'Kožni prsluk Protect – Limited Edition — zadnja strana sa bočnim trakama'),
      img(
        'protect/detail-chest',
        'detail',
        'Horizontalno prošiven panel na grudima',
        'Prošiven grudni panel',
      ),
      img(
        'protect/detail-side-straps',
        'detail',
        'Bočne kožne trake za podešavanje širine',
        'Bočne trake',
      ),
      img(
        'protect/detail-back-panels',
        'detail',
        'Prošiveni paneli na donjem delu leđa',
        'Paneli na leđima',
      ),
    ],
  },
  // 9. SHADOW
  {
    slug: 'prsluk-buckle',
    name: 'Shadow',
    category: 'muski',
    price: { amount: 8500 },
    featured: true,
    shortDescription:
      'Shadow je moto-prsluk od teleće kože sa upečatljivim kaiševima i metalnim šnalama na ramenima.',
    description: [
      'Njegov prepoznatljiv dizajn spaja klasične moto-detalje i praktičnost za duge vožnje. Bočni kaiševi omogućavaju prilagođavanje širine i nošenje preko moto-jakne.',
    ],
    featuresTitle: 'Zašto se Shadow izdvaja',
    features: [
      'Teleća koža: čvrsta, pouzdana i izdržljiva.',
      'Kaiševi sa metalnim šnalama: upečatljiv detalj koji definiše izgled ovog modela.',
      'Bočni kaiševi za proširenje: omogućavaju prilagođavanje širine i nošenje preko moto-jakne.',
      'Crna postava: sa unutrašnjim džepom.',
    ],
    images: [
      main('shadow', 'Shadow'),
      img('buckle-vest-front', 'front', 'Kožni prsluk Shadow — prednja strana'),
      img('buckle-vest-back', 'back', 'Kožni prsluk Shadow — zadnja strana sa bočnim kaiševima'),
      img(
        'buckle-vest-detail-shoulders',
        'detail',
        'Kožne trake sa metalnim kopčama na ramenima prsluka Shadow',
        'Kopče na ramenima',
      ),
      img(
        'buckle-vest-detail-side-buckles',
        'detail',
        'Bočni kaiševi sa kopčama na leđima prsluka Shadow',
        'Bočni kaiševi',
      ),
    ],
    note: 'Photos are cropped phone screenshots of a listing — replace with original high-res photos.',
  },
];

export function findProduct(slug: string | null | undefined): Product | undefined {
  return PRODUCTS.find((p) => p.slug === slug);
}
