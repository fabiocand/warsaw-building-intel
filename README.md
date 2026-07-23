# 🏙 Warsaw Building Intelligence

Search any Warsaw address in one place: apartments for sale, long-term rentals, short-term rentals (Airbnb/Booking-style), and direct links to official city records.

**No AI. No API keys. No billing. Free forever.**

---

## What it does

Type an address like `ul. Jagiellońska 45a, Warszawa` and get:

- **For sale** — live listings scraped from Otodom and Gratka
- **Long-term rent** — live listings scraped from Otodom and OLX
- **Short-term rent** — live listings scraped from Nocowanie and Noclegi-online, plus one-click search links to Booking.com and Airbnb
- **Building profile** — district, and any details found
- **Official Warsaw sources** — direct links to verify ownership, permits, and zoning

---

## Why no AI?

Earlier versions of this project used Claude, Gemini, and OpenRouter to search and summarize listings. All three ran into the same wall: free tiers require billing setup, hit quota limits, or rotate which models are actually free at any given moment.

This version scrapes the listing sites **directly** with no AI in the loop — no API key to configure, no quota to run out, no cost ever. The tradeoff is it depends on those sites' HTML structure staying stable (see [Limitations](#limitations) below).

---

## Tech stack

| Layer | Technology |
|---|---|
| Frontend | Vanilla HTML/CSS/JS — single file, no framework, no build step |
| Backend | Vercel Serverless Function (Node.js) |
| Scraping | [Cheerio](https://cheerio.js.org/) — server-side HTML parsing |
| Hosting | Vercel (free Hobby plan) |

---

## Deploy your own (free, ~5 minutes)

### 1. Upload to GitHub

Create a repo and upload these files keeping the exact folder structure:

```
api/
  search.js
public/
  index.html
vercel.json
package.json
README.md
```

### 2. Deploy on Vercel

1. Go to [vercel.com](https://vercel.com) and sign in with your GitHub account
2. Click **Add New Project** → import your repository
3. Click **Deploy** — no environment variables, no configuration needed

Your site is live at `https://your-project.vercel.app` in about 60 seconds.

### 3. Future updates

Push a change to GitHub and Vercel redeploys automatically.

---

## Project structure

```
warsaw-building-intel/
├── api/
│   └── search.js       # Serverless function — scrapes listing sites directly
├── public/
│   └── index.html      # Frontend — search UI + results rendering
├── vercel.json         # Routing config (API → serverless, / → public)
├── package.json        # Declares the cheerio dependency
└── README.md
```

---

## Data sources

| Category | Source | Method |
|---|---|---|
| For sale | Otodom, Gratka | Direct scrape |
| Long-term rent | Otodom, OLX | Direct scrape |
| Short-term rent | Nocowanie, Noclegi-online | Direct scrape |
| Short-term rent | Booking.com, Airbnb | Search link only — see note below |

**Booking.com and Airbnb are link-only.** Both render their listings with JavaScript after the page loads, so a server-side scraper never sees them — this is a technical wall, not a bug. The app always shows a working search link to each pre-filled with your address instead.

---

## Official Warsaw sources used

| Portal | What it shows |
|---|---|
| [Geoportal Warszawa](https://www.geoportal2.pl/pl/) | Cadastral parcels, zoning plans, aerial view |
| [Mapa własności Warszawy](https://mapa.um.warszawa.pl/mapaApp1/mapa?service=mapa_wlasnosci) | Official city ownership map — zoom in to see plot owners directly |
| [Elektroniczne Księgi Wieczyste (EKW)](https://ekw.ms.gov.pl/eukw_ogol/menu.do) | Land register — legal owners, mortgages |
| [GUNB](https://www.gov.pl/gunb) | Construction permits, occupancy certificates |
| [BIP Warszawa](https://www.bip.warszawa.pl/) | Public bulletin — planning decisions |

---

## Limitations

- **Scrapers can break.** If Otodom, OLX, Gratka, Nocowanie, or Noclegi-online change their page layout, that specific scraper may return no results until its CSS selectors are updated in `api/search.js`. Each scraper fails independently — one breaking doesn't affect the others.
- **Not exhaustive.** Only the first few listings per site are shown, and only for the address (or street) as typed.
- **No ownership names.** True ownership records require a land-register lookup (EKW) with a specific book number — this isn't something that can be looked up by street address alone, so the app links you to the official register instead of guessing.

---

## Disclaimer

Results are gathered from publicly available web sources. Always verify on official portals before making any real estate decisions.

---

## License

MIT — free to use, modify, and deploy.
