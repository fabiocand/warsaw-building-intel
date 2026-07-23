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

    // ── Build a proper OLX search slug ────────────────────────────
    // OLX does NOT support "?q=" as a query string. It requires the
    // search term embedded in the URL path as "q-{slug}/", e.g.:
    //   https://www.olx.pl/nieruchomosci/mieszkania/warszawa/q-mieszkanie-na-sprzedaz/
    // Passing it as "?q=" was silently ignored, so OLX was serving its
    // default unfiltered Warsaw listing page every time. This builds
    // the correct path-style slug instead.
    function toOlxSlug(addr) {
      const s = addr
        .replace(/ul\.|ulica\./gi, '')
        .replace(/,.*$/, '')
        .trim()
        .toLowerCase()
        .replace(/\s+/g, '-');
      return encodeURIComponent(s);
    }

    const qShort = encodeURIComponent(address.replace(/ul\.|ulica\./gi, '').trim());
    const streetOnly = address.replace(/ul\.|ulica\.|\d+[a-zA-Z]*/gi, '').replace(/,.*$/, '').trim();
    const olxSlug = toOlxSlug(address);

    const headers = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      'Accept-Language': 'pl-PL,pl;q=0.9,en;q=0.8',
      'Cache-Control': 'no-cache'
    };

    function cleanText(str) {
      return (str || '')
        .replace(/css-[a-z0-9]+\{[^}]*\}/gi, '')
        .replace(/\s+/g, ' ')
        .trim();
    }

    async function fetchPage(url, timeoutMs = 5500) {
      try {
        const r = await fetch(url, { headers, signal: AbortSignal.timeout(timeoutMs) });
        if (!r.ok) return null;
        return await r.text();
      } catch { return null; }
    }

    async function safeScrape(fn, label) {
      try {
        return await fn();
      } catch (e) {
        console.error(`${label} scraper failed:`, e && e.message);
        return [];
      }
    }

    // ── OLX SALE (properly filtered) ──────────────────────────────
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

    // ── OLX RENT (properly filtered) ──────────────────────────────
    async function fetchOLXRent() {
      const url = `https://www.olx.pl/nieruchomosci/mieszkania/wynajem/warszawa/q-${olxSlug}/`;
      const html = await fetchPage(url);
      if (!html) return [];
      const $ = cheerio.load(html);
      const results = [];
      $('[data-cy="l-card"]').each((i, el) => {
        if (i >= 4) return false;
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

    // ── OTODOM (bonus, blocked by bot detection most of the time) ──
    async function fetchOtodomSale() {
      const url = `https://www.otodom.pl/pl/wyniki/sprzedaz/mieszkanie/mazowieckie/warszawa/warszawa/warszawa?searchingCriteria=${qShort}&limit=6`;
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

    async function fetchOtodomRent() {
      const url = `https://www.otodom.pl/pl/wyniki/wynajem/mieszkanie/mazowieckie/warszawa/warszawa/warszawa?searchingCriteria=${qShort}&limit=6`;
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

    // ── Gratka (bonus, unverified filter reliability) ─────────────
    async function fetchGratka() {
      const url = `https://gratka.pl/nieruchomosci/mieszkania/warszawa?phrase=${qShort}`;
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

    const [olxSale, otodomSale, gratka, otodomRent, olxRent] = await Promise.all([
      safeScrape(fetchOLXSale, 'OLX sale'),
      safeScrape(fetchOtodomSale, 'Otodom sale'),
      safeScrape(fetchGratka, 'Gratka'),
      safeScrape(fetchOtodomRent, 'Otodom rent'),
      safeScrape(fetchOLXRent, 'OLX rent')
    ]);

    // ── Short-term rent: honest link-only mode ─────────────────────
    // Nocowanie and Noclegi-online do not expose a reliable text-based
    // address filter (confirmed: their query params were being ignored,
    // silently returning generic Warsaw-wide listings instead). Rather
    // than present unfiltered results as if they matched the address,
    // these are now search links only — same honest treatment as
    // Booking.com and Airbnb, which are JS-rendered and can't be
    // scraped server-side at all.
    const addrEncoded = encodeURIComponent(address);
    const shortTerm = [
      { title: 'Search on Booking.com', size: '', rating: null, reviews: null, price: 'Check on site', source: 'Booking.com', url: `https://www.booking.com/searchresults.html?ss=${addrEncoded}`, photos: [] },
      { title: 'Search on Airbnb', size: '', rating: null, reviews: null, price: 'Check on site', source: 'Airbnb', url: `https://www.airbnb.com/s/${encodeURIComponent(streetOnly + ' Warsaw')}/homes`, photos: [] },
      { title: 'Browse apartments on Nocowanie.pl', size: '', rating: null, reviews: null, price: 'Check on site', source: 'Nocowanie', url: `https://www.nocowanie.pl/noclegi/warszawa/apartamenty/`, photos: [] },
      { title: `Search "${address}" short-term rentals on Google`, size: '', rating: null, reviews: null, price: '', source: 'Google', url: `https://www.google.com/search?q=${encodeURIComponent('apartament na dobę ' + address)}`, photos: [] }
    ];

    return res.status(200).json({
      building_info: {
        district: '', year: '', floors: '', style: '', total_units: '', developer: '',
        notes: `Live results for "${address}" — sale and rent listings filtered via OLX's search. Otodom and Gratka included as bonus sources when accessible. Short-term rentals are search links since those sites can't be reliably filtered by exact address server-side.`
      },
      sale_listings: [...olxSale, ...otodomSale, ...gratka].slice(0, 6),
      long_term_rentals: [...olxRent, ...otodomRent].slice(0, 6),
      short_term_rentals: shortTerm,
      ownership: []
    });

  } catch (err) {
    console.error('Handler crashed:', err);
    return res.status(500).json({ error: 'Search temporarily failed: ' + (err && err.message ? err.message : 'unknown server error') });
  }
}
