import * as cheerio from 'cheerio';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { address } = req.body || {};
    if (!address) return res.status(400).json({ error: 'Address required' });

    // Real estate classifieds index ads by street/neighbourhood, never
    // exact house number, so search by street name only.
    function extractStreetName(addr) {
      return addr
        .replace(/ul\.|ulica\./gi, '')
        .replace(/,.*$/, '')
        .replace(/\s+\d+[a-zA-Z]*\s*$/, '')
        .trim();
    }

    const streetOnly = extractStreetName(address);
    const qShort = encodeURIComponent(streetOnly);

    // OLX requires the search term embedded in the URL path as
    // "q-{slug}/" — verified against real OLX search-result URLs.
    function toOlxSlug(text) {
      return encodeURIComponent(text.toLowerCase().replace(/\s+/g, '-'));
    }
    const olxSlug = toOlxSlug(streetOnly);

    const headers = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      'Accept-Language': 'pl-PL,pl;q=0.9,en;q=0.8',
      'Cache-Control': 'no-cache'
    };

    function cleanText(str) {
      return (str || '').replace(/css-[a-z0-9]+\{[^}]*\}/gi, '').replace(/\s+/g, ' ').trim();
    }

    async function fetchPage(url, timeoutMs = 5500) {
      try {
        const r = await fetch(url, { headers, signal: AbortSignal.timeout(timeoutMs) });
        if (!r.ok) return null;
        return await r.text();
      } catch { return null; }
    }

    async function safeScrape(fn, label) {
      try { return await fn(); }
      catch (e) { console.error(`${label} failed:`, e && e.message); return []; }
    }

    // ── OLX sale (verified reliable — doesn't block scraping) ──────
    async function fetchOLXSale() {
      const url = `https://www.olx.pl/nieruchomosci/mieszkania/sprzedaz/warszawa/q-${olxSlug}/`;
      const html = await fetchPage(url);
      if (!html) return [];
      const $ = cheerio.load(html);
      const results = [];
      $('[data-cy="l-card"]').each((i, el) => {
        if (i >= 5) return false;
        const title = cleanText($(el).find('h4, h6, [data-cy="ad-card-title"]').first().text());
        const rawPrice = $(el).find('[data-testid="ad-price"]').text() || '';
        const priceMatch = rawPrice.match(/[\d\s]+(?:zł|PLN|€|\$)/);
        const price = priceMatch ? priceMatch[0].trim() : cleanText(rawPrice).substring(0, 25);
        const href = $(el).find('a').first().attr('href');
        const imgSrc = $(el).find('img[src^="http"]').first().attr('src');
        if (title) results.push({
          title, size: '', rooms: '', floor: '', price, source: 'OLX',
          url: href ? (href.startsWith('http') ? href : 'https://www.olx.pl' + href) : url,
          photos: imgSrc ? [imgSrc] : []
        });
      });
      return results;
    }

    // ── OLX rent (verified reliable) ────────────────────────────────
    async function fetchOLXRent() {
      const url = `https://www.olx.pl/nieruchomosci/mieszkania/wynajem/warszawa/q-${olxSlug}/`;
      const html = await fetchPage(url);
      if (!html) return [];
      const $ = cheerio.load(html);
      const results = [];
      $('[data-cy="l-card"]').each((i, el) => {
        if (i >= 5) return false;
        const title = cleanText($(el).find('h4, h6, [data-cy="ad-card-title"]').first().text());
        const rawPrice = $(el).find('[data-testid="ad-price"]').text() || '';
        const priceMatch = rawPrice.match(/[\d\s]+(?:zł|PLN|€|\$)/);
        const price = priceMatch ? priceMatch[0].trim() : cleanText(rawPrice).substring(0, 25);
        const href = $(el).find('a').first().attr('href');
        const imgSrc = $(el).find('img[src^="http"]').first().attr('src');
        if (title) results.push({
          title, size: '', rooms: '', floor: '', price, source: 'OLX',
          url: href ? (href.startsWith('http') ? href : 'https://www.olx.pl' + href) : url,
          photos: imgSrc ? [imgSrc] : []
        });
      });
      return results;
    }

    // ── Otodom (bonus best-effort — actively blocks bots, often empty) ──
    async function fetchOtodomSale() {
      const url = `https://www.otodom.pl/pl/wyniki/sprzedaz/mieszkanie/mazowieckie/warszawa/warszawa/warszawa?limit=6`;
      const html = await fetchPage(url);
      if (!html) return [];
      const $ = cheerio.load(html);
      const results = [];
      $('[data-cy="listing-item"]').each((i, el) => {
        if (i >= 4) return false;
        const title = cleanText($(el).find('[data-cy="listing-item-title"]').text());
        const price = cleanText($(el).find('strong').first().text());
        const href = $(el).find('a').attr('href');
        const size = cleanText($(el).find('[data-testid="listing-item-size"]').text());
        const rooms = cleanText($(el).find('[data-testid="listing-item-rooms"]').text());
        const imgSrc = $(el).find('img[src^="http"]').first().attr('src');
        if (title) results.push({
          title, size, rooms, floor: '', price, source: 'Otodom',
          url: href ? (href.startsWith('http') ? href : 'https://www.otodom.pl' + href) : url,
          photos: imgSrc ? [imgSrc] : []
        });
      });
      return results;
    }

    // ── Gratka (bonus best-effort — unverified filter reliability) ──
    async function fetchGratka() {
      const url = `https://gratka.pl/nieruchomosci/mieszkania/warszawa`;
      const html = await fetchPage(url);
      if (!html) return [];
      const $ = cheerio.load(html);
      const results = [];
      $('.listing__item, article.offer-item').each((i, el) => {
        if (i >= 3) return false;
        const title = cleanText($(el).find('h2, h3, .offer-item__title').first().text());
        const price = cleanText($(el).find('.offer-item__price, .price').first().text());
        const href = $(el).find('a').first().attr('href');
        const imgSrc = $(el).find('img[src^="http"]').first().attr('src');
        if (title) results.push({
          title, size: '', rooms: '', floor: '', price, source: 'Gratka',
          url: href ? (href.startsWith('http') ? href : 'https://gratka.pl' + href) : url,
          photos: imgSrc ? [imgSrc] : []
        });
      });
      return results;
    }

    const [olxSale, olxRent, otodomSale, gratka] = await Promise.all([
      safeScrape(fetchOLXSale, 'OLX sale'),
      safeScrape(fetchOLXRent, 'OLX rent'),
      safeScrape(fetchOtodomSale, 'Otodom sale'),
      safeScrape(fetchGratka, 'Gratka')
    ]);

    // ── Honest direct links (always correct, never scraped) ─────────
    const addrEncoded = encodeURIComponent(address);
    const directLinks = {
      sale: [
        { label: 'OLX — full search results', url: `https://www.olx.pl/nieruchomosci/mieszkania/sprzedaz/warszawa/q-${olxSlug}/` },
        { label: 'Otodom — Warsaw listings', url: `https://www.otodom.pl/pl/wyniki/sprzedaz/mieszkanie/mazowieckie/warszawa/warszawa/warszawa` },
        { label: 'Gratka — Warsaw listings', url: `https://gratka.pl/nieruchomosci/mieszkania/warszawa` }
      ],
      rent: [
        { label: 'OLX — full search results', url: `https://www.olx.pl/nieruchomosci/mieszkania/wynajem/warszawa/q-${olxSlug}/` },
        { label: 'Otodom — Warsaw listings', url: `https://www.otodom.pl/pl/wyniki/wynajem/mieszkanie/mazowieckie/warszawa/warszawa/warszawa` }
      ],
      shortTerm: [
        { label: 'Booking.com', url: `https://www.booking.com/searchresults.html?ss=${addrEncoded}` },
        { label: 'Airbnb', url: `https://www.airbnb.com/s/${encodeURIComponent(streetOnly + ' Warsaw')}/homes` },
        { label: 'Nocowanie.pl', url: `https://www.nocowanie.pl/noclegi/warszawa/apartamenty/` }
      ]
    };

    return res.status(200).json({
      building_info: {
        district: '', year: '', floors: '', style: '', total_units: '', developer: '',
        notes: `Results for ul. ${streetOnly} (street-level — classifieds don't index by exact house number). OLX listings below are genuinely filtered to this street. Otodom/Gratka are shown as bonus best-effort results when accessible.`
      },
      sale_listings: [...olxSale, ...otodomSale, ...gratka].slice(0, 6),
      long_term_rentals: [...olxRent].slice(0, 6),
      direct_links: directLinks,
      ownership: []
    });

  } catch (err) {
    console.error('Handler crashed:', err);
    return res.status(500).json({ error: 'Search temporarily failed: ' + (err && err.message ? err.message : 'unknown server error') });
  }
}
