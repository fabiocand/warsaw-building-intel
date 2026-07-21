# 🏙 Warsaw Building Intelligence

A free, open-source web app to research any Warsaw address in one place. Find apartments for sale, long-term rentals, short-term rentals (Airbnb/Booking), and links to official city records — all from a single search.

**Live demo:** _your-project.vercel.app_

---

## What it does

Type any Warsaw address and instantly see:

- 🏷 **For sale** — listings from Otodom, Gratka, Adresowo
- 🏠 **Long-term rent** — monthly listings from Otodom, OLX, Gratka
- 📅 **Short-term rent** — nightly listings from Airbnb, Booking.com, Trip.com
- 🏢 **Building profile** — year built, floors, developer, avg price/m²
- 👤 **Ownership info** — from public records where available
- 🏛 **Official Warsaw sources** — direct links to Geoportal, EKW land register, GUNB, BIP

---

## Tech stack

| Layer | Technology |
|---|---|
| Frontend | Vanilla HTML/CSS/JS — single file, no framework |
| Backend | Vercel Serverless Function (Node.js) |
| AI / Search | Google Gemini 2.0 Flash with Google Search grounding |
| Hosting | Vercel (free Hobby plan) |

---

## Deploy your own (free, ~10 minutes)

### 1. Get a free Gemini API key

1. Go to [aistudio.google.com](https://aistudio.google.com)
2. Click **Get API key** → **Create API key**
3. Copy the key — it looks like `AIzaSy...`

### 2. Fork or upload to GitHub

Clone this repo or create a new GitHub repo and upload these files keeping the exact folder structure:

```
api/
  search.js
public/
  index.html
vercel.json
README.md
```

### 3. Deploy on Vercel

1. Go to [vercel.com](https://vercel.com) and sign in with your GitHub account
2. Click **Add New Project** → import your repository
3. Under **Environment Variables** add:
   - **Key:** `GEMINI_API_KEY`
   - **Value:** your key from Step 1
4. Click **Deploy**

Your site will be live at `https://your-project.vercel.app` in about 60 seconds.

### 4. Update later

Any time you push a change to GitHub, Vercel redeploys automatically.

---

## Project structure

```
warsaw-building-intel/
├── api/
│   └── search.js        # Serverless function — calls Gemini API
├── public/
│   └── index.html       # Full frontend — search UI + results rendering
├── vercel.json          # Routing config (API → serverless, / → public)
└── README.md
```

---

## Free tier limits

| Service | Free limit |
|---|---|
| Gemini 2.0 Flash | 1,500 requests/day, 15 requests/minute |
| Vercel Hobby | 100GB bandwidth/month, unlimited deployments |

More than enough for personal or small-team use.

---

## Official Warsaw sources used

| Portal | What it shows |
|---|---|
| [Geoportal Warszawa](https://geoportal.um.warszawa.pl/mapaWarszawy/) | Cadastral parcels, zoning plans, aerial view |
| [Elektroniczne Księgi Wieczyste (EKW)](https://ekw.ms.gov.pl/eukw_ogol/menu.do) | Land register — legal owners, mortgages |
| [Miejski Informator Multimedialny (MIM)](https://mim.um.warszawa.pl/mapa/) | Building data, permits, address registry |
| [GUNB](https://www.gunb.gov.pl/) | Construction permits, occupancy certificates |
| [BIP Warszawa](https://bip.warszawa.pl/) | Planning decisions, local resolutions |

---

## Disclaimer

Results are gathered from publicly available web sources and AI search. Always verify information on official portals before making any real estate decisions. Ownership data from EKW requires manual lookup and is not automatically retrieved.

---

## License

MIT — free to use, modify, and deploy.
