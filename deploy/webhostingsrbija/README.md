# Postavljanje CeroLeather preview verzije na WebHostingSrbija (Standard, deljeni hosting)

Ovo je **međuverzija za klijenta**, ne konačno puštanje sajta. Sajt je potpuno **statičan**: nema Node.js servera,
baze ni PHP-a. Hosting samo isporučuje fajlove.

## 1. Build (na računaru)

```bash
npm ci          # samo prvi put ili posle promene package.json
npm run build   # = ng build (production) + sitemap.xml i robots.txt
```

Rezultat: **`dist/ceroleather/browser/`**. Na hosting ide **sadržaj** ovog foldera, ne sam folder.

> `dist/ceroleather/prerendered-routes.json` i `3rdpartylicenses.txt` (van `browser/`) se **ne** postavljaju.

## 2. Šta se postavlja i gde

Preporuka: **poddomen** (npr. `preview.vasdomen.rs`) ili koren domena. Sajt je napravljen za koren (`<base href="/">`).
Za podfolder (npr. `vasdomen.rs/preview/`) potreban je poseban build (`ng build --base-href /preview/`) i izmena
`RewriteBase` u `.htaccess`, pa je bolje izbeći.

U cPanel → **File Manager** otvorite folder domena/poddomena (npr. `public_html/` ili `public_html/preview/`):

1. Obrišite stare fajlove sajta (ako postoje).
2. Postavite **sve** iz `dist/ceroleather/browser/`: `index.html`, `index.csr.html`, `*.js`, `*.css`, foldere
   `assets/`, `katalog/`, `o-nama/`, `porudzbina/`, ikonice, `site.webmanifest`, `sitemap.xml`.
   Najlakše: spakujte sadržaj u ZIP, postavite ga i u File Manageru izaberite **Extract**.
3. Postavite **`.htaccess`** iz ovog foldera (`deploy/webhostingsrbija/.htaccess`) pored `index.html`.
   Fajl počinje tačkom, pa je u File Manageru skriven dok ne uključite *Settings → Show Hidden Files*.
4. Zamenite `robots.txt` onim iz ovog foldera: preview ne treba da indeksira Google.
5. Folder `videos/` (3 MB, izvorni snimak za 360° frejmove) sajt ne koristi. Može da se preskoči.

Ukupno ~49 MB. Sajt učitava optimizovane 3D modele `assets/models/prsluk-3dmodel.webp.glb` (5,4 MB) i
`prsluk-3dmodel-mobile.webp.glb` (3,4 MB). Originali `prsluk-3dmodel.glb` (15 MB) i `prsluk-3dmodel-mobile.glb`
(5,5 MB) ostaju u projektu samo kao rezerva za povratak. Sajt ih ne koristi, pa ne moraju da se postavljaju (−21 MB).

## 3. Provera posle postavljanja (obavezno)

`.htaccess` nije moguće proveriti unapred, jer zavisi od podešavanja servera. Otvorite redom, **u novom tabu,
direktno kucanjem adrese** (ne klikom po sajtu):

| Adresa | Očekivano |
|---|---|
| `/` | početna strana, 3D prsluk se učitava |
| `/katalog` | katalog, bez preusmeravanja na `/katalog/` |
| `/katalog/prsluk-kosmaj` | stranica modela; posle **F5** i dalje ista stranica |
| `/porudzbina?zahtev=custom` | forma bez sekcije „Model“, sa fotografijom |
| `/porudzbina?zahtev=katalog&proizvod=prsluk-buckle` | forma sa izabranim modelom Shadow |
| `/o-nama` | O nama |
| `/nepostojeca-strana` | CeroLeather strana „Stranica nije pronađena“ (ne serverska 404) |
| `/assets/models/prsluk-3dmodel.glb` | preuzima se fajl (F12 → Network: tip `model/gltf-binary`) |

U F12 → Console ne sme biti crvenih grešaka.

**Ako dobijete „500 Internal Server Error“:** preimenujte `.htaccess` u `htaccess.off` i javite poruku iz
cPanel → *Errors*. Sajt i bez `.htaccess` radi za posetioce koji kreću sa početne. Direktne adrese tada mogu da
dobiju `/` na kraju, a nepostojeće adrese serversku 404 stranu.

**Ako `/katalog` radi, ali `/nepostojeca-strana` daje serversku 404:** `mod_rewrite` nije aktivan. Javite to podršci
hostinga ili meni.

## 4. EmailJS i Cloudinary na novom domenu

- **EmailJS → Account → Security → Allowed origins:** dodajte tačnu adresu preview-a (npr.
  `https://preview.vasdomen.rs`). Ako je ova lista uključena, a domen nije na njoj, slanje forme ne uspeva
  (EmailJS odbija zahtev).
- **Cloudinary:** unsigned preset `ceroleather_custom_requests` ne zahteva domen. Ništa ne treba menjati.
- Posle postavljanja pošaljite po jedan test zahtev iz oba toka (custom i katalog) i proverite da su stigla
  oba emaila (radionici i automatska potvrda kupcu).

## 5. Poznata ograničenja preview verzije

- Zvanični domen je `https://ceroleather.rs` (`siteUrl` u `src/environments/environment.ts`). Kanonski linkovi, sitemap
  i link „Pogledaj model na sajtu“ u emailu radionici vode tamo i kada se preview gleda na drugoj adresi. To je
  namerno i za preview ne smeta (stranice su `noindex`).
- **SSL:** u cPanel → *SSL/TLS Status* pokrenite AutoSSL za poddomen, pa u `.htaccess` uključite preusmeravanje na
  HTTPS (dva reda sa `#`).
- **Konačno puštanje:** obrišite blok „PREVIEW ONLY“ iz `.htaccess` i vratite generisani `robots.txt`.
