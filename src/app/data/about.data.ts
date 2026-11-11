/**
 * "O NAMA" PAGE CONTENT
 * ---------------------
 * ⚠ PLACEHOLDER TEXT (Lorem ipsum). Replace the strings below with the real company story —
 *   the page layout does not need to change. Do not add facts (year founded, location,
 *   materials, numbers) until they are confirmed.
 *
 * Images: any file from public/assets/images/ (use the `-sm` version for smaller slots).
 */

export interface AboutSection {
  /** anchor id, also used for in-page links */
  id: string;
  eyebrow: string;
  title: string;
  paragraphs: string[];
  image?: { src: string; srcSm: string; alt: string };
  /** optional list of short points */
  points?: string[];
}

export const ABOUT_INTRO = {
  eyebrow: 'O nama',
  titleLines: ['Ruke, koža', 'i put.'],
  lead: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Integer posuere erat a ante venenatis dapibus posuere velit aliquet.',
};

export const ABOUT_SECTIONS: AboutSection[] = [
  {
    id: 'prica',
    eyebrow: '01 — Naša priča',
    title: 'Kako je sve počelo',
    paragraphs: [
      'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Vivamus lacinia odio vitae vestibulum vestibulum. Cras venenatis euismod malesuada. Nulla facilisi.',
      'Curabitur blandit tempus porttitor. Maecenas faucibus mollis interdum. Donec ullamcorper nulla non metus auctor fringilla, vestibulum id ligula porta felis euismod semper.',
    ],
    image: {
      src: 'assets/images/products/strap-vest-side.webp',
      srcSm: 'assets/images/products/strap-vest-side-sm.webp',
      alt: 'Crni kožni prsluk CeroLeather',
    },
  },
  {
    id: 'zanat',
    eyebrow: '02 — Zanat',
    title: 'Ručna izrada',
    paragraphs: [
      'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Aenean lacinia bibendum nulla sed consectetur. Etiam porta sem malesuada magna mollis euismod.',
      'Sed posuere consectetur est at lobortis. Nullam quis risus eget urna mollis ornare vel eu leo.',
    ],
    image: {
      src: 'assets/images/products/strap-vest-detail-shoulder.webp',
      srcSm: 'assets/images/products/strap-vest-detail-shoulder-sm.webp',
      alt: 'Detalj ručno prošivenog ramenog panela',
    },
  },
  {
    id: 'proizvodi',
    eyebrow: '03 — Kožni proizvodi',
    title: 'Prsluci, jakne i custom modeli',
    paragraphs: [
      'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Donec sed odio dui. Cum sociis natoque penatibus et magnis dis parturient montes, nascetur ridiculus mus.',
    ],
    points: [
      'Lorem ipsum dolor sit amet',
      'Consectetur adipiscing elit',
      'Integer posuere erat a ante',
    ],
    image: {
      src: 'assets/images/products/zip-vest-front.webp',
      srcSm: 'assets/images/products/zip-vest-front-sm.webp',
      alt: 'Kožni prsluk sa centralnim rajsferšlusom',
    },
  },
  {
    id: 'kvalitet',
    eyebrow: '04 — Kvalitet',
    title: 'Pažnja prema detaljima',
    paragraphs: [
      'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Maecenas sed diam eget risus varius blandit sit amet non magna. Vestibulum id ligula porta felis euismod semper.',
      'Fusce dapibus, tellus ac cursus commodo, tortor mauris condimentum nibh, ut fermentum massa justo sit amet risus.',
    ],
    image: {
      src: 'assets/images/products/strap-vest-detail-grain.webp',
      srcSm: 'assets/images/products/strap-vest-detail-grain-sm.webp',
      alt: 'Tekstura kože izbliza',
    },
  },
];
