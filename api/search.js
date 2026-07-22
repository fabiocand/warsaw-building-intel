import * as cheerio from 'cheerio';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { address } = req.body || {};
  if (!address) return res.status(400).json({ error: 'Address required' });

  const q = encodeURIComponent(address);
  const qShort = encodeURIComponent(address.replace(/ul\.|ulica\./gi, '').trim());

  const headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
    'Accept-Language': 'pl-PL,pl;q=0.9,en;q=0.8',
    'Cache-Control': 'no-cache'
  };

  async function fetchPage(url) {
    try {
      const r = await fetch(url, { headers, signal: AbortSignal.timeout(8000) });
      if (!r.ok) return null;
      return await r.text();
    } catch { return null; }
  }

  // ── OTODOM sale ──────────────────────────────────────────────
  async function fetchOtodomSale() {
    const url = `https://www.otodom.pl/pl/wyniki/sprzedaz/mieszkanie/mazowieckie/warszawa/warszawa/warszawa?searchingCriteria=${q}&limit=6`;
    const html = await fetchPage(url);
    if (!html) return [];
    const $ = cheerio.load(html);
    const results = [];
    $('[data-cy="listing-item"]').each((i, el) => {
      if (i >= 4) return false;
      const title = $(el).find('[data-cy="listing-item-title"]').text().trim();
      const price = $(el).find('[data-testid="listing-item-header"]').text().trim() || $(el).find('strong').first().text().trim();
      const href = $(el).find('a').attr('href');
      const size = $(el).find('[data-testid="listing-item-size"]').text().trim();
      const rooms = $(el).find('[data-testid="listing-item-rooms"]').text().trim();
      const imgSrc = $(el).find('img').attr('src') || $(el).find('img').attr('data-src');
      if (title || price) {
        results.push({
          title: title || 'Apartment for sale',
          size: size || '',
          rooms: rooms || '',
          floor: '',
          price: price || '',
          source: 'Otodom',
          url: href ? (href.startsWith('http') ? href : 'https://www.otodom.pl' + href) : url,
          photos: imgSrc ? [imgSrc] : []
        });
      }
    });
    return results;
  }

  // ── OTODOM long-term rent ────────────────────────────────────
  async function fetchOtodomRent() {
    const url = `https://www.otodom.pl/pl/wyniki/wynajem/mieszkanie/mazowieckie/warszawa/warszawa/warszawa?searchingCriteria=${q}&limit=6`;
    const html = await fetchPage(url);
    if (!html) return [];
    const $ = cheerio.load(html);
    const results = [];
    $('[data-cy="listing-item"]').each((i, el) => {
      if (i >= 4) return false;
      const title = $(el).find('[data-cy="listing-item-title"]').text().trim();
      const price = $(el).find('[data-testid="listing-item-header"]').text().trim() || $(el).find('strong').first().text().trim();
      const href = $(el).find('a').attr('href');
      const size = $(el).find('[data-testid="listing-item-size"]').text().trim();
      const rooms = $(el).find('[data-testid="listing-item-rooms"]').text().trim();
      const imgSrc = $(el).find('img').attr('src') || $(el).find('img').attr('data-src');
      if (title || price) {
        results.push({
          title: title || 'Apartment for rent',
          size: size || '',
          rooms: rooms || '',
          floor: '',
          price: price || '',
          source: 'Otodom',
          url: href ? (href.startsWith('http') ? href : 'https://www.otodom.pl' + href) : url,
          photos: imgSrc ? [imgSrc] : []
        });
      }
    });
    return results;
  }

  // ── OLX rent ─────────────────────────────────────────────────
  async function fetchOLX() {
    const url = `https://www.olx.pl/nieruchomosci/mieszkania/wynajem/warszawa/?search%5Bfilter_float_price%3Afrom%5D=&q=${qShort}`;
    const html = await fetchPage(url);
    if (!html) return [];
    const $ = cheerio.load(html);
    const results = [];
    $('[data-cy="l-card"]').each((i, el) => {
      if (i >= 4) return false;
      const title = $(el).find('h6, h4, [data-testid="ad-title"]').first().text().trim();
      const price = $(el).find('[data-testid="ad-price"]').text().trim();
      const href = $(el).find('a').attr('href');
      const imgSrc = $(el).find('img').attr('src');
      if (title || price) {
        results.push({
          title: title || 'Apartment for rent',
          size: '',
          rooms: '',
          floor: '',
          price: price || '',
          source: 'OLX',
          url: href ? (href.startsWith('http') ? href : 'https://www.olx.pl' + href) : url,
          photos: imgSrc ? [imgSrc] : []
        });
      }
    });
    return results;
  }

  // ── Gratka sale ───────────────────────────────────────────────
  async function fetchGratka() {
    const url = `https://gratka.pl/nieruchomosci/mieszkania/warszawa?phrase=${qShort}`;
    const html = await fetchPage(url);
    if (!html) return [];
    const $ = cheerio.load(html);
    const results = [];
    $('.listing__item, article.offer-item').each((i, el) => {
      if (i >= 3) return false;
      const title = $(el).find('h2, .offer-item__title, h3').first().text().trim();
      const price = $(el).find('.offer-item__price, .price').first().text().trim();
      const href = $(el).find('a').first().attr('href');
      const imgSrc = $(el).find('img').first().attr('src') || $(el).find('img').first().attr('data-src');
      if (title || price) {
        results.push({
          title: title || 'Apartment',
          size: '',
          rooms: '',
          floor: '',
          price: price || '',
          source: 'Gratka',
          url: href ? (href.startsWith('http') ? href : 'https://gratka.pl' + href) : url,
          photos: imgSrc ? [imgSrc] : []
        });
      }
    });
    return results;
  }

  // ── Run all fetches in parallel ───────────────────────────────
  const [otodomSale, otodomRent, olxRent, gratka] = await Promise.all([
    fetchOtodomSale(),
    fetchOtodomRent(),
    fetchOLX(),
    fetchGratka()
  ]);

  // Merge long-term rentals
  const longTermRentals = [...otodomRent, ...olxRent].slice(0, 6);

  // Build short-term links (these sites block scraping, so we provide deep search links)
  const addrEncoded = encodeURIComponent(address);
  const shortTermLinks = [
    {
      title: 'Search on Booking.com',
      size: '', rating: null, reviews: null,
      price: 'Check on site',
      source: 'Booking.com',
      url: `https://www.booking.com/searchresults.html?ss=${addrEncoded}&checkin_year=2024&checkin_month=8&checkin_monthday=1&checkout_year=2024&checkout_month=8&checkout_monthday=7`,
      photos: []
    },
    {
      title: 'Search on Airbnb',
      size: '', rating: null, reviews: null,
      price: 'Check on site',
      source: 'Airbnb',
      url: `https://www.airbnb.com/s/${addrEncoded}/homes`,
      photos: []
    },
    {
      title: 'Search on Nocowanie.pl',
      size: '', rating: null, reviews: null,
      price: 'Check on site',
      source: 'Nocowanie',
      url: `https://nocowanie.pl/szukaj/?q=${addrEncoded}`,
      photos: []
    }
  ];

  // Build official links
  const streetOnly = address.replace(/ul\.|ulica\.|\d+[a-zA-Z]*/gi, '').trim();
  const officialLinks = {
    geoportal: `https://geoportal.um.warszawa.pl/mapaWarszawy/`,
    ekw: `https://ekw.ms.gov.pl/eukw_ogol/menu.do`,
    mim: `https://mim.um.warszawa.pl/mapa/`,
    gunb: `https://www.gunb.gov.pl/`,
    bip: `https://bip.warszawa.pl/`
  };

  return res.status(200).json({
    building_info: {
      district: '',
      year: '',
      floors: '',
      style: '',
      total_units: '',
      developer: '',
      notes: `Results fetched live from Otodom, OLX and Gratka for "${address}". Short-term rentals link to Booking.com and Airbnb search pages. For ownership details use the official EKW land register link.`
    },
    sale_listings: [...otodomSale, ...gratka].slice(0, 6),
    long_term_rentals: longTermRentals,
    short_term_rentals: shortTermLinks,
    ownership: [],
    official_links: officialLinks
  });
}
