# CeroLeather — digitalni showroom

Angular 22 (standalone, zoneless) · TypeScript · SCSS · Three.js · GSAP ScrollTrigger · Lenis · EmailJS.
Frontend-only: bez korpe, plaćanja, naloga i backend-a. Jedina eksterna integracija je EmailJS.

## Pokretanje

```bash
npm install
npm start          # http://localhost:4200
npm run build      # produkcijski build → dist/ceroleather/browser
```

Korisni URL parametri za testiranje: `?quality=low` (slabiji uređaj), `?quality=none` (bez WebGL-a → foto/SVG fallback).

## Struktura

```
src/app/
  core/config/        site.config.ts (kontakt, Instagram, cene), three-assets.config.ts (GLB modeli)
  core/services/      email, scroll (Lenis+GSAP), order-state (vodič ↔ forma), device-capability
  data/               products.data.ts, categories.data.ts, measurements.data.ts  ← SAV SADRŽAJ
  models/             TypeScript tipovi
  three/              čist Three.js (bez Angulara): hero-scene, mannequin-scene, proceduralni modeli, loader
  components/         header, footer, hero, product-viewer-3d, story, product-card, product-catalog,
                      product-gallery, measurement-guide (+ step, 3D viewer, SVG fallback), order-form, contact-section
  pages/              home, catalog, product-detail, order, not-found
  shared/             logo, reveal i parallax direktive
public/assets/        images/products/*.webp, images/textures/, models/ (GLB ide ovde)
```

Rute: `/`, `/katalog?kategorija=prsluci|jakne|custom`, `/katalog/:slug`, `/porudzbina?proizvod=<slug>`.

## Dodavanje proizvoda

1. Slike stavite u `public/assets/images/products/` — po dve WebP verzije: `ime.webp` (~1600px) i `ime-sm.webp` (~760px).
2. Dodajte objekat u `PRODUCTS` u `src/app/data/products.data.ts` (`slug`, `name`, `category`, opisi, `features`, `images`).
3. `price` je opcion; cene se prikazuju tek kada je `SITE_CONFIG.showPrices = true`.
4. `measurementIds` (opciono) ograničava koje mere vodič prikazuje za taj model.

UI se ne menja. Kategorija „Kožne jakne“ automatski prikazuje karticu „Jakna po vašoj meri“ dok ne postoji nijedna jakna.

## Mere (vodič za merenje)

Sve u `src/app/data/measurements.data.ts`: tekstovi, koraci, savet, min/max, položaj 3D trake (`guide3d`),
kadar kamere (`camera`) i SVG fallback (`svg`). Nova mera = novi objekat — vodič, forma i email se generišu sami.
**Tekstove i granice potvrdite sa radionicom.**

## 3D modeli (GLB/GLTF)

Trenutno se koriste proceduralni 3D placeholderi (prsluk modelovan po modelu „Strap“, krojačka lutka).

1. Fajl stavite u `public/assets/models/` (npr. `vest.glb`, `mannequin.glb`).
2. U `src/app/core/config/three-assets.config.ts` postavite `glbUrl: 'assets/models/vest.glb'` (i/ili za `mannequin`).
3. Konvencije: Y osa gore, prednja strana gleda ka +Z, skala nebitna (model se automatski centrira i skalira).
   Preporuka: Draco kompresija, teksture ≤ 2048px (≤ 1024px za mobilni), < 5 MB.
4. Mannequin: mere se crtaju raycast-om po površini modela, pa rade i sa novim modelom. Meshevi čije ime sadrži
   `stand`/`base`/`pole` ignorišu se. Po potrebi podesite `heightRatio`/`fromRatio`/`toRatio` u measurements.data.ts.
5. Ako GLB ne uspe da se učita, automatski se koristi placeholder; bez WebGL-a — fotografija / SVG.

## EmailJS konfiguracija

1. Nalog na <https://www.emailjs.com> → **Email Services** → dodajte servis (Gmail/Outlook…) → zapišite **Service ID**.
2. **Email Templates** → novi template. U podešavanjima: **To Email** = `{{to_email}}`, **Reply To** = `{{reply_to}}`.
   Primer sadržaja:

   ```
   Novi upit — {{product_name}} ({{product_category}})
   Ime: {{from_name}}   Email: {{email}}   Telefon: {{phone}}
   Dužina prsluka: {{vest_length_cm}} cm
   Obim grudi: {{chest_cm}} cm
   Obim stomaka: {{abdomen_cm}} cm
   Sve mere:
   {{measurements_summary}}
   Prilagođavanje: {{customization}}
   Poruka: {{message}}
   Model: {{product_url}} · Poslato: {{submitted_at}}
   ```
3. **Account → General** → **Public Key**.
4. Upišite vrednosti u `src/environments/environment.ts` (produkcija) i `environment.development.ts` (lokalno):
   `serviceId`, `templateId`, `publicKey`, a odredišnu adresu u `toEmail`.
5. **Account → Security**: uključite *Allowed origins* (vaš domen) da drugi ne bi koristili vaš ključ.

Forma prikazuje uspeh tek kada EmailJS vrati HTTP 200. Dok ključevi nisu upisani, forma jasno javlja da slanje nije podešeno.

## Asseti koje treba zameniti

| Šta | Gde | Napomena |
|---|---|---|
| Fotografije „Buckle“ prsluka | `buckle-vest-*.webp` | Isečeni screenshotovi oglasa — zameniti originalnim fotografijama |
| Ostale fotografije | `public/assets/images/products/` | Po mogućstvu profesionalni snimci; strap prsluk nema fotografiju leđa |
| Fotografije jakni | — | Ne postoje; dodati modele kategorije `jakne` |
| 3D prsluk i lutka | `three-assets.config.ts` | Proceduralni placeholderi → pravi GLB |
| Kontakt email, Instagram | `environment.ts` → `toEmail`, `site.config.ts` | Trenutno placeholder vrednosti |
| Nazivi modela | `products.data.ts` | Radni nazivi (Strap, Buckle, Classic Zip, Rider, Lace Side) |
| Domen | `environment.ts` → `siteUrl` | Za link ka modelu u emailu |

## Performanse i pristupačnost

- Three.js, GLTF loader i EmailJS SDK su lazy chunk-ovi; inicijalni bundle ≈ 120 kB (gzip).
- Mannequin scena se inicijalizuje tek kad vodič uđe u viewport; render petlje se pauziraju van ekrana.
- Svi Three.js resursi, GSAP konteksti, observer-i i listener-i se oslobađaju na destroy.
- `prefers-reduced-motion`: bez pinovanja/scrub-a, bez smooth scroll-a, statičan kadar.
- Kvalitet renderovanja (rezolucija, broj poligona, veličina tekstura) automatski se smanjuje na slabijim uređajima.
