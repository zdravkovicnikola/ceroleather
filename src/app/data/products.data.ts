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

export const PRODUCTS: Product[] = [
  {
    slug: 'prsluk-strap',
    name: 'Strap',
    category: 'prsluci',
    featured: true,
    shortDescription: 'Crni kožni prsluk sa podesivim bočnim trakama i prošivenim ramenim panelom.',
    description: [
      'Prsluk od crne zrnaste kože sa prošivenim, rebrastim panelom na ramenima i kosim panelima napred koji prate liniju tela.',
      'Sa strane su elastični umeci i po četiri kožne trake sa kopčama, pa se širina prsluka može podesiti na telu. Napred je vertikalni džep sa rajsferšlusom, a unutra, na postavi, još jedan džep sa rajsferšlusom.',
    ],
    features: [
      'Podesive bočne kožne trake sa metalnim kopčama',
      'Prošiven, rebrast panel na ramenima',
      'Spoljni vertikalni džep sa rajsferšlusom',
      'Unutrašnji džep sa rajsferšlusom',
      'Postava i centralni rajsferšlus',
      'Ivice opšivene kožom',
    ],
    images: [
      img('strap-vest-side', 'side', 'Crni kožni prsluk Strap — bočna strana sa podesivim trakama'),
      img(
        'strap-vest-front-open',
        'open',
        'Prsluk Strap — otvoren, vidi se postava i unutrašnji džep',
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
  {
    slug: 'prsluk-buckle',
    name: 'Buckle',
    category: 'prsluci',
    featured: true,
    shortDescription: 'Kožni prsluk sa kopčama na ramenima i bočnim kaiševima sa kopčama.',
    description: [
      'Prsluk sa okruglim izrezom oko vrata, centralnim rajsferšlusom i po dve kožne trake sa metalnim kopčama na svakom ramenu.',
      'Sa strane, na leđima, po tri kaiša sa kopčama omogućavaju podešavanje širine. Napred su dva kosa džepa sa rajsferšlusom.',
    ],
    features: [
      'Kožne trake sa kopčama na ramenima',
      'Po tri bočna kaiša sa kopčama',
      'Dva kosa džepa sa rajsferšlusom',
      'Centralni rajsferšlus i okrugli izrez',
    ],
    images: [
      img('buckle-vest-front', 'front', 'Kožni prsluk Buckle — prednja strana'),
      img('buckle-vest-back', 'back', 'Kožni prsluk Buckle — zadnja strana sa bočnim kaiševima'),
    ],
    // 72 frames extracted from public/videos/prsluk-360.mp4 (watermark cropped out)
    spin360: {
      path: 'assets/images/360/prsluk-buckle',
      frames: 72,
      size: 720,
      sizeSm: 420,
      alt: 'Kožni prsluk Buckle — 360° prikaz, okretanje prevlačenjem',
    },
    note: 'Photos are cropped phone screenshots of a listing — replace with original high-res photos.',
  },
  {
    slug: 'prsluk-classic-zip',
    name: 'Classic Zip',
    category: 'prsluci',
    featured: true,
    shortDescription: 'Čist, minimalistički prsluk sa okruglim izrezom i centralnim rajsferšlusom.',
    description: [
      'Jednostavan kroj bez suvišnih detalja: okrugli izrez, centralni rajsferšlus i poprečni šav na grudima.',
      'Na leđima poprečni šav i dva vertikalna panela daju prsluku oblik. Sve ivice su opšivene kožom.',
    ],
    features: [
      'Okrugli izrez oko vrata',
      'Centralni rajsferšlus',
      'Panelni kroj na leđima',
      'Ivice opšivene kožom',
    ],
    images: [
      img('zip-vest-front', 'front', 'Kožni prsluk Classic Zip — prednja strana'),
      img('zip-vest-back', 'back', 'Kožni prsluk Classic Zip — zadnja strana'),
    ],
  },
  {
    slug: 'prsluk-rider',
    name: 'Rider',
    category: 'prsluci',
    shortDescription: 'Prsluk sa kragnom na drikere, kosim rajsferšlusom i kosim džepovima.',
    description: [
      'Prsluk inspirisan klasičnom motociklističkom jaknom: kragna sa metalnim drikerima i rajsferšlus pomeren u stranu.',
      'Dva kosa džepa sa metalnim rajsferšlusima, struk sa kožnim pojasom i postava.',
    ],
    features: [
      'Kragna sa metalnim drikerima',
      'Asimetričan rajsferšlus',
      'Dva kosa džepa sa rajsferšlusom',
      'Kožni pojas u struku',
      'Postava',
    ],
    images: [
      img('rider-vest-front-open', 'open', 'Kožni prsluk Rider — otvoren, vidi se postava'),
      img('rider-vest-detail-collar', 'detail', 'Kragna sa metalnim drikerima', 'Kragna'),
      img('rider-vest-detail-tag', 'detail', 'CeroLeather etiketa', 'Etiketa'),
    ],
  },
  {
    slug: 'prsluk-lace',
    name: 'Lace Side',
    category: 'custom',
    featured: true,
    shortDescription: 'Unikatan prsluk sa bočnim vezivanjem kožnom pertlom i revers kragnom.',
    description: [
      'Custom model sa bočnim vezivanjem: kožna pertla kroz metalne ringle omogućava podešavanje širine sa strane.',
      'Revers kragna, rajsferšlus u boji mesinga i džep sa preklopom daju prsluku klasičan, old-school karakter.',
    ],
    features: [
      'Bočno vezivanje kožnom pertlom kroz metalne ringle',
      'Revers kragna',
      'Rajsferšlus u boji mesinga',
      'Džep sa preklopom',
    ],
    images: [
      img('lace-vest-front', 'front', 'Kožni prsluk Lace Side sa bočnim vezivanjem'),
      img(
        'lace-vest-detail-lacing',
        'detail',
        'Detalj bočnog vezivanja kožnom pertlom',
        'Bočno vezivanje',
      ),
      img('lace-vest-detail-tag', 'detail', 'CeroLeather etiketa', 'Etiketa'),
    ],
  },

  // ── Models from the workshop photo folders ("CeroLeather slike/<MODEL>/") ──────────────
  // Images: public/assets/images/products/<folder>/<view>.webp (+ <view>-sm.webp).
  // Descriptions list only what is visible in the photos — confirm/extend with the workshop.
  {
    slug: 'prsluk-kosmaj',
    name: 'Kosmaj',
    category: 'prsluci',
    shortDescription:
      'Crni kožni prsluk sa prošivenim ramenima, bočnim trakama sa kopčama i postavom na kocke.',
    description: [
      'Prsluk od crne zrnaste kože sa okruglim izrezom, centralnim rajsferšlusom i romboidno prošivenim panelima na ramenima.',
      'Sa strane su po četiri kožne trake sa metalnim kopčama, a napred dva vertikalna džepa sa rajsferšlusom. Kada se otvori, vidi se crno-bela postava na kocke.',
    ],
    features: [
      'Romboidno prošiveni paneli na ramenima',
      'Po četiri bočne kožne trake sa metalnim kopčama',
      'Dva vertikalna džepa sa rajsferšlusom',
      'Centralni rajsferšlus i okrugli izrez',
      'Crno-bela postava na kocke',
    ],
    images: [
      img('kosmaj/front', 'front', 'Crni kožni prsluk Kosmaj — prednja strana, zakopčan'),
      img(
        'kosmaj/open',
        'open',
        'Prsluk Kosmaj — otkopčan, vidi se crno-bela postava na kocke',
        'Postava na kocke',
      ),
    ],
  },
  {
    slug: 'prsluk-protect',
    name: 'Protect',
    category: 'prsluci',
    shortDescription:
      'Kožni prsluk sa horizontalno prošivenim grudnim panelom i podesivim bočnim trakama.',
    description: [
      'Prsluk od crne kože sa horizontalno prošivenim (rebrastim) panelom preko grudi i ramena i prošivenim panelima napred.',
      'Centralni rajsferšlus, dva vertikalna džepa sa rajsferšlusom i po četiri kožne trake sa strane za podešavanje širine. Leđa su čista, sa vertikalnim šavom.',
    ],
    features: [
      'Horizontalno prošiven panel na grudima i ramenima',
      'Po četiri bočne kožne trake',
      'Dva vertikalna džepa sa rajsferšlusom',
      'Centralni rajsferšlus i okrugli izrez',
    ],
    images: [
      img('protect/front', 'front', 'Kožni prsluk Protect — prednja strana sa prošivenim panelom'),
      img('protect/back', 'back', 'Kožni prsluk Protect — zadnja strana sa bočnim trakama'),
    ],
  },
  {
    slug: 'prsluk-swat',
    name: 'SWAT',
    category: 'prsluci',
    shortDescription:
      'Taktički kožni prsluk sa brzim kopčama na ramenima i maskirnim (kamuflažnim) panelima.',
    description: [
      'Prsluk taktičkog izgleda od crne kože, sa podesivim trakama i brzim kopčama na ramenima.',
      'Napred su paneli od maskirnog materijala u tamnim tonovima i džep sa preklopom, a sa strane trake sa kopčama. Leđa su od crne kože sa poprečnim šavom.',
    ],
    features: [
      'Brze kopče na ramenim trakama',
      'Paneli od tamnog maskirnog materijala',
      'Džep sa preklopom napred',
      'Bočne trake sa kopčama',
    ],
    images: [
      img('swat/front', 'front', 'Kožni prsluk SWAT — prednja strana sa maskirnim panelima'),
      img(
        'swat/front-top',
        'detail',
        'Prsluk SWAT odozgo — brze kopče na ramenima',
        'Kopče na ramenima',
      ),
      img('swat/back', 'back', 'Kožni prsluk SWAT — zadnja strana'),
    ],
  },
  {
    slug: 'jakna-cherry',
    name: 'Cherry',
    category: 'jakne',
    shortDescription: 'Ženska kožna jakna u boji višnje, sjajne teksture, sa džepovima na preklop.',
    description: [
      'Ženski model kraćeg kroja od sjajne kože sa reljefnom teksturom, u tamnoj boji višnje.',
      'Kragna, kopčanje na dugmad, džepovi sa preklopom na grudima i dva donja džepa. Na leđima su dekorativne aplikacije.',
    ],
    features: [
      'Sjajna koža sa reljefnom teksturom, boja višnje',
      'Kragna i kopčanje na dugmad',
      'Džepovi sa preklopom na grudima',
      'Dekorativne aplikacije na leđima',
    ],
    images: [
      img('cherry/front', 'front', 'Ženska kožna jakna Cherry — prednja strana'),
      img(
        'cherry/front-detail',
        'detail',
        'Jakna Cherry — džepovi sa preklopom izbliza',
        'Džepovi na preklop',
      ),
      img('cherry/three-quarter', 'side', 'Jakna Cherry — pogled sa strane, napred'),
      img('cherry/side', 'side', 'Jakna Cherry — bočna strana'),
      img(
        'cherry/back',
        'back',
        'Jakna Cherry — leđa sa dekorativnim aplikacijama',
        'Aplikacije na leđima',
      ),
    ],
  },
  {
    // Source folder: "Second woman model" — display name chosen from the dusty-pink colour.
    slug: 'jakna-blush',
    name: 'Blush',
    category: 'jakne',
    shortDescription:
      'Ženska moto jakna u pastelno roze tonu, sa metalik panelima i kopčama na rukavima.',
    description: [
      'Ženski model kraćeg, moto kroja sa kosim rajsferšlusom i širokom kragnom.',
      'Prednji i zadnji paneli su od sjajne, metalik kože sa sitnom teksturom, a rukavi i bočni delovi u mat, pastelno roze tonu. Na rukavima su po tri trake sa metalnim kopčama i rajsferšlus, a napred džepovi sa rajsferšlusom.',
    ],
    features: [
      'Kosi (moto) rajsferšlus i široka kragna',
      'Metalik paneli sa sitnom teksturom',
      'Tri trake sa metalnim kopčama na svakom rukavu',
      'Rajsferšlus na rukavima',
      'Džepovi sa rajsferšlusom',
    ],
    images: [
      img('blush/front', 'front', 'Ženska kožna moto jakna Blush — prednja strana'),
      img('blush/back', 'back', 'Jakna Blush — zadnja strana sa metalik panelom'),
      img(
        'blush/detail-sleeve',
        'detail',
        'Jakna Blush — rukav sa tri trake i metalnim kopčama',
        'Kopče na rukavu',
      ),
    ],
  },
  // Add new models here — one object per product folder.
];

export function findProduct(slug: string | null | undefined): Product | undefined {
  return PRODUCTS.find((p) => p.slug === slug);
}
