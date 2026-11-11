# EmailJS — podešavanje templatea „Zahtev za porudžbinu“

Ovaj fajl opisuje kako da u EmailJS dashboardu ažurirate **postojeći** template. Kod sajta je već spreman: forma
šalje sve parametre iz `docs/emailjs-field-mapping.md`.

> ⚠ Ovo je lokalna priprema. Template u EmailJS nalogu se menja **ručno** po koracima ispod. Dok to ne uradite i ne
> pošaljete probni zahtev, ne može se smatrati da je email sa fotografijom podešen.

## Pre početka

- Service ID, Template ID i Public Key ostaju **isti**. Upisuju se u `src/environments/environment.ts` (produkcija)
  i `environment.development.ts` (lokalno), polja `emailjs.serviceId`, `emailjs.templateId`, `emailjs.publicKey`.
  Trenutno su prazna; sajt tada javlja da slanje nije podešeno.
- Adresa primaoca se **ne** nalazi u kodu, već samo u templateu (polje *To Email*). Ne menjajte je ovim postupkom.

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
   - **To Email**: ostavite postojeću adresu (trenutno privremena test adresa `nzdravkovic2001@gmail.com`).
     Kada bude spremna poslovna adresa CeroLeather radionice, zamenite je samo ovde.
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

## Probni zahtev sa sajta (ceo tok)

1. Upišite EmailJS ključeve u `src/environments/environment.development.ts`.
2. `npm start` → otvorite <http://localhost:4200/katalog> → na nekom modelu kliknite **Zatraži model**.
3. Popunite formu (sve obavezne mere, adresa, dva checkbox-a), priložite JPG/PNG/WEBP do 5 MB → **Pošalji zahtev**.
4. Proverite:
   - stigao je email na adresu iz *To Email*, subject sadrži model i ime kupca;
   - fotografija se vidi u emailu i link vodi na `https://res.cloudinary.com/hzbtilhe/...`;
   - **Reply** u email programu popunjava email kupca;
   - fotografija je u Cloudinary *Media Library* (folder podešen na presetu `ceroleather_custom_requests`).
5. Pošaljite još jedan zahtev **bez** fotografije i bez poruke: sekcija sa fotografijom ne postoji, a „Poruka kupca“
   glasi „Kupac nije ostavio poruku“.

## Napomene

- Svi `{{…}}` nazivi su osetljivi na velika i mala slova (`designImageUrl` ≠ `designimageurl`).
- EmailJS ograničava veličinu parametara (oko 50 KB po zahtevu). Formular šalje samo tekst i URL, bez fajlova, pa je
  daleko ispod granice.
- Neki email programi (npr. Gmail u svetloj temi) mogu malo da izmene tamnu pozadinu. Sadržaj ostaje čitljiv jer
  su sve boje teksta i pozadine zadate direktno na elementima.
- Posle svake izmene polja forme pokrenite `npm run check:emailjs` (vidi `docs/emailjs-field-mapping.md`, odeljak 3).
