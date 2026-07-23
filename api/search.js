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

    const q = encodeURIComponent(address);
    const qShort = encodeURIComponent(address.replace(/ul\.|ulica\./gi, '').trim());
    const streetOnly = address.replace(/ul\.|ulica\.|\d+[a-zA-Z]*/gi, '').replace(/,.*$/, '').trim();
    const qStreet = encodeURIComponent(streetOnly);

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

    // ── OLX SALE ─────────────────────────────────────────────────
    // OLX does not block server-side requests, unlike Otodom, so this
    // is the primary reliable source for "for sale" listings.
    async function fetchOLXSale() {
      const url = `https://www.olx.pl/nieruchomosci/mieszkania/sprzedaz/warszawa/?q=${qShort}`;
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

    // ── OTODOM sale ──────────────────────────────────────────────
    // Otodom actively blocks automated/bot requests, so this often
    // returns nothing. Kept as a bonus attempt — safe to fail.
    async function fetchOtodomSale() {
      const url = `https://www.otodom.pl/pl/wyniki/sprzedaz/mieszkanie/mazowieckie/warszawa/warszawa/warszawa?searchingCriteria=${q}&limit=6`;
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
      const url = `https://www.otodom.pl/pl/wyniki/wynajem/mieszkanie/mazowieckie/warszawa/warszawa/warszawa?searchingCriteria=${q}&limit=6`;
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

    // ── OLX rent ─────────────────────────────────────────────────
    async function fetchOLXRent() {
      const url = `https://www.olx.pl/nieruchomosci/mieszkania/wynajem/warszawa/?q=${qShort}`;
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

    // ── Gratka sale (best-effort bonus, may also be blocked) ──────
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

    // ── Nocowanie short-term ──────────────────────────────────────
    async function fetchNocowanie() {
      const url = `https://www.nocowanie.pl/noclegi/warszawa/apartamenty/?szukaj=${qStreet}`;
      const html = await fetchPage(url);
      if (!html) return [];
      const $ = cheerio.load(html);
      const results = [];
      $('article, .ob-item, .listing-item, [class*="object-item"], [class*="ob_item"]').each((i, el) => {
        if (i >= 4) return false;
        const title = cleanText($(el).find('h2, h3, h4, .ob-name, [class*="name"]').first().text());
        const rawPrice = cleanText($(el).find('[class*="price"], .cena, .ob-price').first().text());
        const priceMatch = rawPrice.match(/[\d\s]+\s*zł/);
        const price = priceMatch ? priceMatch[0].trim() : (rawPrice.substring(0, 30) || 'Check on site');
        const href = $(el).find('a').first().attr('href');
        const imgSrc = $(el).find('img[src^="http"]').first().attr('src');
        const rating = cleanText($(el).find('[class*="rating"], [class*="score"], .nota').first().text());
        if (title && title.length > 3) results.push({
          title, size: '', rating: parseFloat(rating) || null, reviews: null,
          price,
          source: 'Nocowanie',
          url: href ? (href.startsWith('http') ? href : 'https://www.nocowanie.pl' + href) : url,
          photos: imgSrc ? [imgSrc] : []
        });
      });
      return results;
    }

    async function fetchNoclegiOnline() {
      const url = `https://www.noclegi-online.pl/szukaj/?miasto=warszawa&typ=apartament&fraza=${qStreet}`;
      const html = await fetchPage(url);
      if (!html) return [];
      const $ = cheerio.load(html);
      const results = [];
      $('.item, .offer, .result, article').each((i, el) => {
        if (i >= 3) return false;
        const title = cleanText($(el).find('h2, h3, h4, .name').first().text());
        const rawPrice = cleanText($(el).find('[class*="price"], .cena').first().text());
        const priceMatch = rawPrice.match(/[\d\s]+\s*zł/);
        const price = priceMatch ? priceMatch[0].trim() : (rawPrice.substring(0, 30) || 'Check on site');
        const href = $(el).find('a').first().attr('href');
        const imgSrc = $(el).find('img[src^="http"]').first().attr('src');
        if (title && title.length > 3) results.push({
          title, size: '', rating: null, reviews: null,
          price,
          source: 'Noclegi-online',
          url: href ? (href.startsWith('http') ? href : 'https://www.noclegi-online.pl' + href) : url,
          photos: imgSrc ? [imgSrc] : []
        });
      });
      return results;
    }

    const [olxSale, otodomSale, gratka, otodomRent, olxRent, nocowanie, noclegiOnline] = await Promise.all([
      safeScrape(fetchOLXSale, 'OLX sale'),
      safeScrape(fetchOtodomSale, 'Otodom sale'),
      safeScrape(fetchGratka, 'Gratka'),
      safeScrape(fetchOtodomRent, 'Otodom rent'),
      safeScrape(fetchOLXRent, 'OLX rent'),
      safeScrape(fetchNocowanie, 'Nocowanie'),
      safeScrape(fetchNoclegiOnline, 'Noclegi-online')
    ]);

    const addrEncoded = encodeURIComponent(address);
    let shortTerm = [...nocowanie, ...noclegiOnline].slice(0, 5);

    shortTerm.push(
      { title: 'Search on Booking.com', size: '', rating: null, reviews: null, price: 'Check on site', source: 'Booking.com', url: `https://www.booking.com/searchresults.html?ss=${addrEncoded}`, photos: [] },
      { title: 'Search on Airbnb', size: '', rating: null, reviews: null, price: 'Check on site', source: 'Airbnb', url: `https://www.airbnb.com/s/${encodeURIComponent(streetOnly + ' Warsaw')}/homes`, photos: [] }
    );

    return res.status(200).json({
      building_info: {
        district: '', year: '', floors: '', style: '', total_units: '', developer: '',
        notes: `Live results for "${address}" scraped from OLX, Otodom (when accessible), Gratka and Nocowanie. For ownership details use the EKW land register link below.`
      },
      sale_listings: [...olxSale, ...otodomSale, ...gratka].slice(0, 6),
      long_term_rentals: [...otodomRent, ...olxRent].slice(0, 6),
      short_term_rentals: shortTerm,
      ownership: []
    });

  } catch (err) {
    console.error('Handler crashed:', err);
    return res.status(500).json({ error: 'Search temporarily failed: ' + (err && err.message ? err.message : 'unknown server error') });
  }
}
