# EmailJS — podešavanje templatea „Zahtev za porudžbinu“

Ovaj fajl opisuje kako da u EmailJS dashboardu ažurirate **postojeći** template. Kod sajta je već spreman: forma
šalje sve parametre iz `docs/emailjs-field-mapping.md`.

> ⚠ Ovo je lokalna priprema. Template u EmailJS nalogu se menja **ručno** po koracima ispod. Dok to ne uradite i ne
> pošaljete probni zahtev, ne može se smatrati da je email sa fotografijom podešen.

## Zašto forma sada javlja „Slanje zahteva trenutno nije podešeno na ovom sajtu.“

Sve tri EmailJS vrednosti su **prazne**, i u `src/environments/environment.ts` (produkcijski build) i u
`src/environments/environment.development.ts` (`npm start`). Forma zato ni ne pokušava slanje. To nije greška u kodu,
nego nedostaju podaci iz vašeg EmailJS naloga. U razvojnom režimu konzola pregledača ispisuje koje vrednosti nedostaju.

| Vrednost u `environment*.ts` | Gde je naći u EmailJS-u | Izgleda kao |
|---|---|---|
| `emailjs.serviceId` | **Email Services** → povezani servis (npr. Gmail) → *Service ID* | `service_xxxxxxx` |
| `emailjs.templateId` | **Email Templates** → CeroLeather template → **Settings** → *Template ID* | `template_xxxxxxx` |
| `emailjs.publicKey` | **Account** → **General** → *Public Key* | niz slova i brojeva |

Upišite ih u **oba** fajla, pa `npm run build` (ili `npm start` lokalno). Ove vrednosti su javne po dizajnu; privatni
ključ (*Private Key*) se **nikad** ne upisuje u sajt.

Ako još nemate servis: **Email Services → Add New Service → Gmail** i prijavite se Gmail nalogom sa koga šaljete.

## Pre početka

- Adresa primaoca se **ne** nalazi u kodu, već samo u templateu (polje *To Email* = `nzdravkovic2001@gmail.com`).
- Email kupca stiže kao `{{reply_to}}`. Nikad se ne koristi kao primalac.

## Koraci

1. Prijavite se na <https://dashboard.emailjs.com> → **Email Templates** → otvorite postojeći template čiji ID
   piše u `environment.ts` (ili napravite novi i njegov ID upišite tamo).
2. Kartica **Content**:
   - **Subject**: `{{subject}}`
     (primer: „Novi zahtev za model Kosmaj — Marko Petrović“; za custom ideju: „Novi zahtev za custom dizajn — …“)
   - Kliknite **Edit Content** → izaberite **Code Editor** (ikonica `<>`).
   - Obrišite sav postojeći sadržaj i nalepite **ceo** sadržaj fajla `docs/emailjs-template.html`
     (komentar na vrhu može da ostane, ne prikazuje se).
   - Sačuvajte izmene sadržaja (**Apply / Save**).
3. Desna kolona podešavanja templatea:
   - **To Email**: `nzdravkovic2001@gmail.com` (sva pitanja i porudžbine stižu ovde; ne upisujte `{{email}}`
     ni `{{reply_to}}`). Kada bude spremna poslovna adresa CeroLeather radionice, zamenite je samo ovde.
   - **From Name**: `CeroLeather Website`
   - **From Email**: ostavite *Use Default Email Address* (adresa povezanog email servisa).
   - **Reply To**: `{{reply_to}}`. Odgovor na email tada ide direktno kupcu.
   - **Bcc / Cc**: prazno (osim ako želite kopiju).
4. Kartica **Attachments**: **ne dodajte** nijedan prilog. Fotografija stiže kao link sa Cloudinary-ja (`designImageUrl`).
5. Gornji desni ugao → **Save**.
6. **Account → Security**: u *Allowed origins* upišite domen sajta (i `http://localhost:4200` dok testirate
   lokalno), da drugi ne bi koristili vaš nalog.

## Probni email iz EmailJS-a

U editoru templatea kliknite **Test It**. Za svaku promenljivu upišite vrednost iz `docs/emailjs-test-params.json`
(sve su navedene, uključujući opcione i URL fotografije), pa pošaljite.

- **Sa fotografijom**: `designImageUrl` = `https://res.cloudinary.com/demo/image/upload/sample.jpg` → u emailu se vidi
  sekcija „Referentna fotografija kupca“ sa slikom i dugmetom „Pogledaj originalnu fotografiju“.
- **Bez fotografije**: ostavite `designImageUrl` prazno → cela sekcija sa fotografijom nestaje (potvrde su tada odmah posle želja kupca).
- **Custom ideja**: ostavite `product_url` prazno → nema linka „Pogledaj model na sajtu“.

## Probni zahtevi sa sajta (oba toka)

Forma ima dva toka, određena linkom (`?zahtev=`), nikad pogađanjem:

| Tok | Ulaz | „Model“ | Fotografija |
|---|---|---|---|
| **Custom dizajn** | dugme **Zatraži model** u zaglavlju (`/porudzbina?zahtev=custom`), link bez parametra, kartica „jakna po meri“ | skriveno | prikazana (opciono) → Cloudinary → `designImageUrl` |
| **Model iz kataloga** | **Zatraži model** na kartici proizvoda (`/porudzbina?zahtev=katalog&proizvod=<slug>`), forma na stranici proizvoda | prikazano, popunjeno | skrivena, ništa se ne otprema |

1. Upišite EmailJS vrednosti u `src/environments/environment.development.ts` → `npm start`.
2. **Custom:** <http://localhost:4200> → **Zatraži model** (zaglavlje) → popunite formu, priložite JPG/PNG/WEBP
   do 5 MB → **Pošalji zahtev**. U emailu: „Sopstvena ideja (custom dizajn)“, fotografija i dugme ka originalu.
3. **Katalog:** <http://localhost:4200/katalog> → **Zatraži model** na nekom modelu → pošaljite. U emailu: naziv
   modela, kategorija, link „Pogledaj model na sajtu“, bez sekcije sa fotografijom.
4. Proverite u `nzdravkovic2001@gmail.com`:
   - oba emaila su stigla, a subject sadrži model (ili „custom dizajn“) i ime kupca;
   - **Reply** popunjava email kupca;
   - fotografija custom zahteva je u Cloudinary *Media Library*.
5. Ako nešto ne radi, otvorite konzolu pregledača (F12) u `npm start` režimu. Poruka `[CeroLeather] …` kaže da li
   nedostaje vrednost, da li je EmailJS odbio zahtev (pogrešan ID/ključ ili *Allowed origins*) ili je u pitanju mreža.

## Napomene

- Svi `{{…}}` nazivi su osetljivi na velika i mala slova (`designImageUrl` ≠ `designimageurl`).
- EmailJS ograničava veličinu parametara (oko 50 KB po zahtevu). Formular šalje samo tekst i URL, bez fajlova, pa je
  daleko ispod granice.
- Neki email programi (npr. Gmail u svetloj temi) mogu malo da izmene tamnu pozadinu. Sadržaj ostaje čitljiv jer
  su sve boje teksta i pozadine zadate direktno na elementima.
- Posle svake izmene polja forme pokrenite `npm run check:emailjs` (vidi `docs/emailjs-field-mapping.md`, odeljak 3).
