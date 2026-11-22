# EmailJS — inventar polja forme i mapiranje parametara

Izvor istine:

| Šta | Fajl |
|---|---|
| Polja forme (Reactive Forms `FormGroup`) i validacija | `src/app/components/order-form/order-form.component.ts` |
| Mere (id, oznaka, obavezno, opseg, `emailParam`) | `src/app/data/measurements.data.ts` |
| **Lista EmailJS parametara i njihove vrednosti** | `src/app/core/services/order-email-params.ts` → `ORDER_EMAIL_PARAMS`, `toTemplateParams()` |
| HTML template za EmailJS | `docs/emailjs-template.html` |
| Primer vrednosti za svaki parametar | `docs/emailjs-test-params.json` |

Provera da su sva četiri usklađena: `npm run check:emailjs`.

Forma je na stranici **/porudzbina** („Po meri“) i na svakoj stranici proizvoda (isti `app-order-form`).
Slanje: `OrderFormComponent.submit()` → (opciono) `CloudinaryUploadService.upload()` → `EmailService.sendOrderRequest()`
→ `emailjs.send(serviceId, templateId, toTemplateParams(request))`.

## 1. Inventar svih polja forme

Forma nema radio dugmad ni polja sa višestrukim izborom. Ima 2 padajuće liste (`select`), 2 obavezna checkbox-a i
2 tekstualna polja (`textarea`).

| # | Sekcija u formi | Kontrola (Angular) | Tip | Obavezno | Validacija |
|---|---|---|---|---|---|
| 1 | 01 Vaši podaci | `firstName` | text | da | 2–60 znakova |
| 2 | 01 Vaši podaci | `lastName` | text | da | 2–60 znakova |
| 3 | 01 Vaši podaci | `phone` | tel | da | 8–15 cifara, dozvoljeni `+ - ( ) /` i razmak |
| 4 | 01 Vaši podaci | `email` | email | da | ispravna adresa sa domenom (npr. `ime@gmail.com`) |
| 5 | 01 → Adresa za dostavu | `street` | text | da | 3–120 znakova |
| 6 | 01 → Adresa za dostavu | `postalCode` | text | da | tačno 5 cifara |
| 7 | 01 → Adresa za dostavu | `city` | text | da | 2–60 znakova |
| 8 | 02 Model | `productSlug` | select | da | model iz kataloga ili „Sopstvena ideja (custom)“ (`sopstvena-ideja`) |
| 9 | 02 Model | `category` | select | da | Muški prsluci / Ženski prsluci / Custom modeli; za model iz kataloga se popunjava sama |
| 10 | 03 Mere | `measurements.vestLength` | broj (cm) | da | 35–100 cm |
| 11 | 03 Mere | `measurements.chest` | broj (cm) | da | 60–180 cm |
| 12 | 03 Mere | `measurements.waist` | broj (cm) | da | 55–170 cm |
| 13 | 03 Mere | `measurements.height` | broj (cm) | ne (okvirno) | 140–220 cm |
| 14 | 04 Vaše želje | `customization` | textarea | ne | do 2000 znakova |
| 15 | 04 Vaše želje | `message` | textarea | ne | do 2000 znakova |
| 16 | 04 → Priložite fotografiju željenog modela | `designFile` (signal, ne FormControl) | fajl | ne | JPG/JPEG/PNG/WEBP, najviše 5 MB |
| 17 | 05 Potvrda porudžbine i avans | `advanceAck` | checkbox | da | mora biti označen |
| 18 | 05 Potvrda porudžbine i avans | `privacyConsent` | checkbox | da | mora biti označen |
| — | (skriveno) | `website` | honeypot | — | zamka za botove; ako je popunjeno, ništa se ne šalje. **Namerno se ne šalje u email.** |

**Dva toka forme:** u **custom** toku sekcija „Model“ (`productSlug`, `category`) se ne prikazuje:
`product_name` = „Sopstvena ideja (custom)“, `product_slug` = `sopstvena-ideja`, `product_url` prazno, a
`product_category` je „Custom modeli“ (ili kategorija iz `?kategorija=` u linku). U **katalog** toku nema
otpremanja fotografije, pa je `designImageUrl` uvek prazan. Sve ostale vrednosti se šalju u oba toka.

## 2. Mapiranje: polje → EmailJS parametar → oznaka u emailu

Sve vrednosti su gotov tekst na srpskom (sa jedinicama), pa prazna opciona polja nikad ne ostavljaju prazno mesto.

| Angular kontrola / izvor | EmailJS parametar | Oznaka u emailu | Obavezno | Vrednost kada je prazno / napomena |
|---|---|---|---|---|
| `firstName` | `first_name` | Ime | da | — |
| `lastName` | `last_name` | Prezime | da | — |
| `firstName` + `lastName` | `customer_name` | zaglavlje emaila | da | „Ime Prezime“ |
| `phone` | `phone` | Broj telefona (link za poziv) | da | — |
| `email` | `email` | Email (link) | da | — |
| `email` | `reply_to` | podešavanje **Reply To** | da | ista adresa kao `email` |
| `street` | `address_street` | Adresa za dostavu (1. red) | da | — |
| `postalCode` | `address_postal_code` | Adresa za dostavu (2. red) | da | — |
| `city` | `address_city` | Adresa za dostavu (2. red) | da | — |
| `street` + `postalCode` + `city` | `address_full` | (samo tekstualna verzija) | da | „Ulica 1, 11000 Beograd“ |
| `productSlug` | `product_name` | Izabrani model / zaglavlje | da | „Sopstvena ideja (custom)“ |
| `productSlug` | `product_slug` | Oznaka modela | da | `sopstvena-ideja` za custom |
| `productSlug` | `product_url` | link „Pogledaj model na sajtu“ | ne | **prazno** za custom ideju → link se ne prikazuje |
| tok forme (`mode`: `?zahtev=custom` / `katalog`) | `request_type` | Vrsta zahteva / zaglavlje | da | „Model iz kataloga“ ili „Sopstvena ideja (custom dizajn)“; iz toka, nikad iz polja proizvoda |
| `category` | `product_category` | Kategorija | da | — |
| `measurements.vestLength` | `vest_length_cm` | Dužina prsluka | da | „62 cm“ |
| `measurements.chest` | `chest_cm` | Obim grudi | da | „104 cm“ |
| `measurements.waist` | `waist_cm` | Obim struka | da | „92,5 cm“ |
| `measurements.height` | `height_cm` | Visina osobe (opciono, okvirno) | ne | „182 cm (okvirno)“ ili „Nije uneto (opciono)“ |
| sve mere | `measurements_summary` | (samo tekstualna verzija) | — | sve 4 mere, jedna po redu |
| `customization` | `customization` | Dodatni zahtevi za prilagođavanje | ne | „Nema dodatnih zahteva“ |
| `message` | `message` | Poruka kupca | ne | „Kupac nije ostavio poruku“ |
| `designFile` → Cloudinary `secure_url` | `designImageUrl` | Referentna fotografija kupca (sekcija između 04 i 05) | ne | **prazan string** → cela sekcija sa fotografijom se izostavlja |
| `advanceAck` | `advance_acknowledged` | Avans | da | „Da — kupac razume da je avans obavezan“ |
| `privacyConsent` | `privacy_consent` | Obrada podataka | da | „Da — saglasnost data“ |
| (vreme slanja) | `submitted_at` | Poslato | — | npr. „11. 11. 2026. 18:42:07“ |
| `customer_name` + `product_name` | `subject` | podešavanje **Subject** | — | „Novi zahtev za model Kosmaj — Marko Petrović“ / „Novi zahtev za custom dizajn — Marko Petrović“ |
| sve gore | `order_summary` | (samo tekstualna verzija) | — | ceo zahtev kao čitljiv tekst; ista je i u dugmetu „Kopiraj moje podatke“ |

Parametri `address_full`, `measurements_summary` i `order_summary` nisu u HTML templateu (podaci su već prikazani
po poljima). Šalju se kao rezerva, ako nekad zatreba jednostavan tekstualni template.

**Izmene naziva u odnosu na prethodnu verziju:** `from_name` je zamenjen sa `customer_name`, da se ne meša sa
podešavanjem **From Name** („CeroLeather Website“). Vrednosti mera sada sadrže jedinicu („62 cm“), a prazna opciona
polja imaju tekst umesto „—“. Svi ostali nazivi su isti.

## 3. Dodavanje novog polja u budućnosti

1. Dodajte kontrolu u `order-form.component.ts/html` (i u `OrderRequest`, ako je novi podatak).
2. Dodajte naziv u `ORDER_EMAIL_PARAMS` i vrednost u `toTemplateParams()` (`order-email-params.ts`). TypeScript
   javlja grešku dok vrednost ne postoji.
3. Dodajte `{{naziv}}` u `docs/emailjs-template.html`, red u ovu tabelu i primer u `docs/emailjs-test-params.json`.
4. Pokrenite `npm run check:emailjs`, pa nalepite novi template u EmailJS.

Nova **mera** se dodaje u `measurements.data.ts` (sa `emailParam`), pa se ista 4 koraka primene na njen `emailParam`.
