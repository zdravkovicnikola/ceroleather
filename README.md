# CeroLeather — digitalni showroom

Angular 22 (standalone, zoneless) · TypeScript · SCSS · Three.js · GSAP ScrollTrigger · Lenis · EmailJS.
Statički sajt (SSG): bez korpe, online plaćanja, naloga i sopstvenog backend-a. Jedina eksterna integracija je EmailJS.

## Pokretanje

```bash
npm install
npm start          # razvoj: http://localhost:4200
npm run build      # produkcija → dist/ceroleather/browser (+ sitemap.xml i robots.txt)
```

Korisni URL parametri za testiranje: `?quality=low` (slabiji uređaj), `?quality=none` (bez WebGL-a → foto/SVG fallback).

## Renderovanje i SEO (SSG)

Sajt koristi **Static Site Generation**: `ng build` prerenderuje svaku javnu stranicu u zaseban HTML fajl
(`/`, `/katalog`, `/katalog/<slug>` za svaki proizvod, `/o-nama`, `/porudzbina`). Pretraživači i društvene mreže
dobijaju kompletan sadržaj, naslove, opise, canonical, Open Graph i JSON-LD bez izvršavanja JavaScript-a.
U pregledaču se aplikacija zatim „hidrira“ i radi kao i ranije (animacije, 3D, forma).

- Konfiguracija: `src/app/app.routes.server.ts` (koje rute se prerenderuju), `src/main.server.ts`, `angular.json` → `outputMode: "static"`.
- SEO tekstovi po stranici: `src/app/app.routes.ts` (`data.seo`); stranice proizvoda: `ProductDetailPage` (iz `products.data.ts`).
- `sitemap.xml` i `robots.txt` generiše `scripts/generate-seo-files.mjs` posle svakog `npm run build`,
  na osnovu stvarno prerenderovanih ruta i `siteUrl` iz `environment.ts` (ili env `SITE_URL`).
- Komponente koje zavise od pregledača (3D, 360°, katalog sa filterom, forma) označene su `ngSkipHydration`.

**Hosting** (bilo koji statički hosting — Netlify, Vercel, Cloudflare Pages, Apache/Nginx): objavite sadržaj
`dist/ceroleather/browser`. Za nepostojeće URL-ove podesite fallback na **`index.csr.html`** (prikazuje „Stranica nije pronađena“).
Primer Netlify `_redirects`: `/*  /index.csr.html  404`.

## Struktura

```
src/app/
  core/config/        site.config.ts (kontakt, Instagram, cene), three-assets.config.ts (GLB modeli)
  core/seo/           seo.service.ts (title, meta, canonical, OG, JSON-LD)
  core/services/      email, scroll (Lenis+GSAP), order-state (vodič ↔ forma), device-capability
  data/               products, categories, measurements, about  ← SAV SADRŽAJ
  models/             TypeScript tipovi
  three/              čist Three.js: hero-scene, mannequin-scene, proceduralni modeli, loader
  components/         header, footer, hero, product-viewer-3d, product-viewer-360, story, product-card,
                      product-catalog, product-gallery, measurement-guide, order-form, process
  pages/              home, catalog, product-detail, about (O nama), order, not-found
  shared/             logo, instagram ikona, reveal i parallax direktive
public/assets/        images/products/*.webp, images/360/<model>/NN.webp, images/textures/, models/ (GLB),
                      images/brand/logo-reference.webp (originalna tkana etiketa — „potpis radionice“ na početnoj)
public/               favicon.ico (16/32/48), favicon-16x16/32x32.png, apple-touch-icon.png, icon-192/512.png,
                      site.webmanifest — iz originalne etikete (logo-reference.jpg): belo pismo sa fotografije na crvenom kvadratu
public/videos/        prsluk-360.mp4 (izvorni snimak za 360° frejmove)
scripts/              generate-seo-files.mjs
```

Rute: `/`, `/katalog?kategorija=prsluci|jakne|custom`, `/katalog/:slug`, `/o-nama`, `/porudzbina?proizvod=<slug>`.

## Dodavanje proizvoda

1. Slike stavite u `public/assets/images/products/<model>/` (jedna fascikla po modelu, kao `kosmaj/`, `cherry/`) — po dve WebP verzije: `pogled.webp` (najduža strana ≤1600px) i `pogled-sm.webp` (širina 760px). U podacima: `img('kosmaj/front', 'front', 'opis slike')`. **Prva slika** u nizu je slika u katalogu; ostale su u galeriji. Galerija prikazuje celu fotografiju (bez sečenja), pa format snimka nije bitan.
2. Dodajte objekat u `PRODUCTS` u `src/app/data/products.data.ts` (`slug`, `name`, `category`, opisi, `features`, `images`).
3. `price` je opcion; cene se prikazuju tek kada je `SITE_CONFIG.showPrices = true`.
4. `measurementIds` (opciono) ograničava koje mere vodič prikazuje za taj model.
5. `spin360` (opciono) uključuje 360° prikaz (vidi ispod).

Stranica proizvoda, SEO, JSON-LD i sitemap se generišu automatski.

## 360° prikaz proizvoda

Interaktivni prikaz je **niz fotografija/frejmova** snimljenih ukrug (nije 3D model). Okretanje mišem, prstom,
strelicama na tastaturi i dugmićima; meki prelaz između frejmova, inercija, učitavanje tek kada se prikaz približi
ekranu, manji frejmovi na telefonima, fotografija kao rezerva ako frejmovi ne mogu da se učitaju.

Trenutno: model **Buckle**, 72 frejma izvučena iz `public/videos/prsluk-360.mp4` (4 s, 1080×1080, 30 fps),
isečena tako da vodeni žig i QR kod ne ulaze u kadar → `public/assets/images/360/prsluk-buckle/00..71.webp` (720px)
i `00-sm..71-sm.webp` (420px). Ukupno ≈ 610 KB (desktop) / ≈ 270 KB (telefon).

Novi 360° prikaz:
1. Snimite proizvod na gramofonu (jedan pun krug, ravnomerna brzina, mirna pozadina, fiksna kamera).
2. Izvucite 36–72 ravnomerno raspoređena frejma, isecite na kvadrat, sačuvajte kao `NN.webp` i `NN-sm.webp`.
   Primer sa ffmpeg-om (72 frejma iz videa od 4 s):
   `ffmpeg -i video.mp4 -vf "fps=18,crop=760:760:160:245,scale=720:720" -c:v libwebp -quality 76 %02d.webp`
   (numeraciju prilagodite da kreće od `00`).
3. U proizvodu dodajte `spin360: { path: 'assets/images/360/<slug>', frames: 72, size: 720, sizeSm: 420, alt: '…' }`.
   Ako se proizvod okreće u suprotnom smeru, dodajte `direction: -1`.

## Mere (vodič za merenje)

Sve u `src/app/data/measurements.data.ts`: obavezne **Dužina prsluka**, **Obim grudi** (`chest_cm`), **Obim struka** i opciona
**Visina osobe (okvirno)**. Tekstovi, koraci, savet, min/max, položaj 3D trake (`guide3d`), kadar kamere (`camera`),
SVG fallback (`svg`) i kratak opis u formi (`formHint`). Mera bez `guide3d`/`svg` (npr. visina) prikazuje se u vodiču
i formi, ali se ne crta na lutki. Nova mera = novi objekat — vodič, forma i email se generišu sami.
**Tekstove i granice potvrdite sa radionicom.**

## Tok porudžbine i avans

Forma šalje **zahtev za porudžbinu**, ne kupovinu. Postoje dva toka, određena linkom (`?zahtev=`):

- **Custom dizajn**: `/porudzbina?zahtev=custom` (dugme „Zatraži model“ u zaglavlju; i podrazumevano kada parametra
  nema). Nema sekcije „Model“; kupac opisuje ideju i može da priloži fotografiju (Cloudinary).
- **Model iz kataloga**: `/porudzbina?zahtev=katalog&proizvod=<slug>` (kartice u katalogu) i forma na stranici
  proizvoda. Sekcija „Model“ je popunjena, a otpremanja fotografije nema.

Koraci:

1. Kupac unosi mere i lične podatke (ime, prezime, adresa: ulica i broj, poštanski broj, mesto; telefon, email).
2. Pre slanja vidi objašnjenje procesa i potvrđuje (obavezni checkbox-ovi) da razume da je **avans obavezan**
   i da daje saglasnost za korišćenje podataka radi obrade zahteva.
3. Zahtev stiže emailom; vlasnik zove kupca, dogovaraju detalje, iznos i način uplate avansa.
4. Porudžbina je potvrđena tek nakon uplate avansa.

Uspeh se prikazuje **tek kada EmailJS vrati HTTP 200**. Ako slanje ne uspe: podaci ostaju u formi, čuvaju se lokalno na
uređaju kupca (`localStorage`, briše se posle uspešnog slanja) i vraćaju se posle osvežavanja stranice; kupac može da
kopira sve podatke jednim klikom i pošalje ih Instagram porukom ili emailom.

> ⚠ **Politika privatnosti još ne postoji.** Tekst saglasnosti je kratak i opisuje svrhu obrade; pravni tekst
> (rukovalac podacima, rok čuvanja, prava lica po ZZPL) treba da pripremi vlasnik/pravnik, pa da se poveže iz forme.

## EmailJS konfiguracija

Sajt nema sopstveni server, pa koristi postojeću EmailJS integraciju. U kodu je samo EmailJS **public key**, koji je
javni po dizajnu; privatni ključ, Gmail/SMTP pristup i adresa primaoca su samo u EmailJS nalogu, nikad u kodu.

| Fajl | Sadržaj |
|---|---|
| `docs/emailjs-template.html` | kompletan HTML template (nalepiti u EmailJS → Code Editor) |
| `docs/emailjs-template-setup.md` | korak po korak: Subject, From Name, Reply To, To Email, test |
| `docs/emailjs-field-mapping.md` | inventar svih polja forme → EmailJS parametar → oznaka u emailu |
| `docs/emailjs-test-params.json` | primer vrednosti za svaki parametar (za *Test It* u EmailJS-u) |
| `src/app/core/services/order-email-params.ts` | izvor istine: `ORDER_EMAIL_PARAMS` i `toTemplateParams()` |

Ukratko: **Subject** `{{subject}}` · **From Name** `CeroLeather Website` · **Reply To** `{{reply_to}}` ·
**To Email** ostaje postojeća adresa u EmailJS-u (trenutno test adresa `nzdravkovic2001@gmail.com`) · bez priloga.
Ključeve (`serviceId`, `templateId`, `publicKey`) upišite u `src/environments/environment*.ts`; u
**Account → Security** uključite *Allowed origins* (vaš domen).

Fotografija kupca se ne šalje kao prilog: sajt je otpremi na Cloudinary i EmailJS-u pošalje samo URL
(`designImageUrl`; prazno = bez fotografije, pa se sekcija u emailu izostavlja).

Posle svake izmene forme ili templatea: `npm run check:emailjs` proverava da se nazivi u kodu, templateu, test
parametrima i dokumentaciji poklapaju (`npm run check:emailjs -- <folder>` pravi i HTML preglede emaila).

Dok ključevi nisu upisani, forma jasno javlja da slanje nije podešeno (podaci se ne gube).

## Cloudinary — fotografije koje kupci prilože

Kupac može (opciono) da priloži **jednu** fotografiju ili skicu (JPG, JPEG, PNG, WEBP, najviše 5 MB). Tok:

1. Fotografija se bira i prikazuje **lokalno** (ništa se ne šalje dok kupac ne klikne „Pošalji zahtev“).
2. Na slanje: fotografija → Cloudinary (*unsigned upload*, `CloudinaryUploadService`) → dobija se `secure_url`.
3. Zahtev + `designImageUrl` → EmailJS. Ako EmailJS ne uspe, URL se pamti (i u lokalnom nacrtu), pa ponovni pokušaj
   **ne otprema** fotografiju ponovo. Zamenom ili uklanjanjem fotografije stari URL se poništava.
4. Bez fotografije nema poziva ka Cloudinary-ju. Fotografije iz kataloga se nikad ne otpremaju.

Podešavanje (`src/environments/environment*.ts` → `cloudinary`):

| Vrednost | Trenutno | Napomena |
|---|---|---|
| `cloudName` | `hzbtilhe` | iz URL-a `https://api.cloudinary.com/v1_1/hzbtilhe/image/upload` |
| `uploadPreset` | `ceroleather_custom_requests` | mora biti **Unsigned** preset |

U Cloudinary dashboardu: **Settings → Upload → Upload presets → `ceroleather_custom_requests`**:
- *Signing mode*: **Unsigned**
- *Asset folder* (folder): npr. `ceroleather/custom-requests` — tu se slažu sve fotografije kupaca
- *Allowed formats*: `jpg, jpeg, png, webp` · *Max file size*: 5 MB (dodatna zaštita, sajt to već proverava)
- po želji *Unique filename* uključeno, *Overwrite* isključeno

**API Secret se nigde ne koristi niti upisuje** — unsigned upload ga ne zahteva. Napomena: unsigned preset je javan
(svako ko zna ime može da otpremi sliku u vaš nalog), zato ograničite formate i veličinu na presetu i povremeno
pregledajte folder.

## Logo

Tekstualni wordmark (`shared/components/logo.component.ts`): „Cero“ u Google fontu **Damion** (skript inspirisan
crvenom tkanom etiketom), „Leather“ nepromenjeno u fontu Anton. Bez slike — oštar u svakoj veličini.

## Asseti i podaci koje treba zameniti

| Šta | Gde | Napomena |
|---|---|---|
| Fotografije „Buckle“ prsluka | `buckle-vest-*.webp` | Isečeni screenshotovi oglasa — zameniti originalnim fotografijama |
| 360° frejmovi | `images/360/prsluk-buckle/` | Izvorni video je render (Tripo Studio), ne snimak kamerom — po mogućstvu zameniti snimkom pravog prsluka |
| Ostale fotografije | `public/assets/images/products/` | Po mogućstvu profesionalni snimci |
| Fotografije jakni | — | Ne postoje; dodati modele kategorije `jakne` |
| 3D prsluk i lutka | `three-assets.config.ts` | Proceduralni placeholderi → pravi GLB |
| Tekst „O nama“ | `src/app/data/about.data.ts` | Lorem ipsum placeholder |
| Javni kontakt email | `site.config.ts` → `contactEmail` | `porudzbine@ceroleather.rs` |
| Primalac zahteva | EmailJS template → To Email | Trenutno test adresa `nzdravkovic2001@gmail.com` |
| Domen | `environment.ts` → `siteUrl` | Za canonical, sitemap, OG slike i link u emailu: `https://ceroleather.rs` |
| Politika privatnosti | — | Ne postoji — potreban pravni tekst |
| Nazivi modela | `products.data.ts` | Radni nazivi (Strap, Buckle, Classic Zip, Rider, Lace Side) |

## 3D modeli (GLB/GLTF)

1. Fajl stavite u `public/assets/models/` (npr. `vest.glb`, `mannequin.glb`).
2. U `src/app/core/config/three-assets.config.ts` postavite `glbUrl: 'assets/models/vest.glb'` (i/ili za `mannequin`).
3. Konvencije: Y osa gore, prednja strana gleda ka +Z, skala nebitna (model se automatski centrira i skalira).
   Preporuka: Draco kompresija, teksture ≤ 2048px (≤ 1024px za mobilni), < 5 MB.
4. Mannequin: mere se crtaju raycast-om po površini modela, pa rade i sa novim modelom. Meshevi čije ime sadrži
   `stand`/`base`/`pole` ignorišu se. Po potrebi podesite `heightRatio`/`fromRatio`/`toRatio` u measurements.data.ts.
5. Ako GLB ne uspe da se učita, automatski se koristi placeholder; bez WebGL-a — fotografija / SVG.

### Početna strana — pravi model prsluka

| | |
|---|---|
| Izvor | `Desktop/CeroLeather slike/NOVI DIZAJN/3d model v1.glb` (59 MB, original se ne menja) |
| Model | 1 mesh, ~976k temena / 1,78M trouglova, PBR materijal (boja, roughness/metalness, normal mapa 2048², JPEG), bez animacija |
| Desktop | `public/assets/models/prsluk-3dmodel-v4.glb` — geometrija 60 % (1,07M trouglova), Draco + teksture WebP q92 (4,64 MB) |
| Telefon / slabiji uređaji | `public/assets/models/prsluk-3dmodel-v4-mobile.glb` — geometrija 15 % (267k trouglova), Draco + WebP q85 (1,82 MB) |
| Draco dekoder | `public/assets/draco/` — kopija iz `three/examples/jsm/libs/draco/` (bez CDN-a) |

- Prednja strana (rajsferšlus) gleda ka **+Z**, pa je `rotationY: 0`. Materijal se koristi kako je napravljen
  (roughness mapa ≈ 0,49 — polumat koža); menja se samo `envMapIntensity: 0.5`.
- Kako su napravljene kopije (glTF-Transform CLI, nije zavisnost projekta):
  ```
  # desktop
  gltf-transform webp "3d model v1.glb" t.glb --quality 92
  gltf-transform simplify t.glb s.glb --ratio 0.6 --error 0.0002
  gltf-transform draco s.glb prsluk-3dmodel-v4.glb --method edgebreaker --quantize-position 14 --quantize-normal 10 --quantize-texcoord 12
  # telefon
  gltf-transform webp "3d model v1.glb" tm.glb --quality 85
  gltf-transform simplify tm.glb sm.glb --ratio 0.15 --error 0.0004
  gltf-transform draco sm.glb prsluk-3dmodel-v4-mobile.glb (iste Draco opcije)
  ```
  Draco `--decode-speed 0` daje ~27 % manju geometriju, ali dekodiranje traje skoro duplo duže — ukupno sporije, pa se ne koristi.
- **Rezerve:** `prsluk-3dmodel-v3*.glb` (ista verzija modela, cela geometrija / 20 %, 6,70 / 2,47 MB) i
  `prsluk-3dmodel-v2*.glb` (`3d model.glb`). Povratak: u configu promenite samo `v4` → `v3` (ili `v2`).
- **Početni kadar** (`initialComposition` u `hero.component.ts`): veličina i položaj se računaju iz stvarnog teksta
  (naslov, opis, dugmad) — prsluk staje desno od teksta (desktop, do +25 %) ili ispod dugmadi (uski ekrani), bez
  preklapanja. Prvi scroll korak vraća `scale` / `objX` / `objY` na stare vrednosti, pa je ostatak animacije isti.
- Senka ispod prsluka prati njegov položaj i veličinu (ranije je stajala fiksno i presecala prsluk na telefonu).
- **Rezerva — prethodni model** ostaje u `public/assets/models/` (`prsluk-3dmodel*.glb`). Povratak: u configu vratite
  `glbUrl`/`glbUrlMobile` na `prsluk-3dmodel.webp.glb` / `prsluk-3dmodel-mobile.webp.glb`, `rotationY: -Math.PI / 2`,
  `material: { roughnessFactor: 4.6, envMapIntensity: 0.5 }` i uklonite `dracoDecoderPath`.
- Hijerarhija: `pivot` (GSAP scroll: rotacija, pozicija, skala) → `tilt` (blago „disanje“) → `model-wrapper`
  (centriranje i skala) → `model-orientation` (`rotationY`) → GLB. Svaki nivo ima jednu ulogu, pa se rotacije ne sudaraju.
- Ako se GLB ne učita, hero prikazuje fotografiju (nema više proceduralnog prsluka na početnoj).

## Performanse i pristupačnost

- Three.js, GLTF loader i EmailJS SDK su lazy chunk-ovi; inicijalni bundle ≈ 134 kB (gzip).
- 3D scene i 360° frejmovi se učitavaju tek kad uđu u viewport; render petlje se pauziraju van ekrana.
- Svi Three.js resursi, GSAP konteksti, observer-i i listener-i se oslobađaju na destroy.
- `prefers-reduced-motion`: bez pinovanja/scrub-a, bez smooth scroll-a, bez inercije u 360° prikazu.
- Header je na telefonu i tabletu uvek vidljiv (sakriva se pri skrolovanju samo na desktopu); poštuje safe-area.
