export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { address } = req.body || {};
  if (!address) return res.status(400).json({ error: 'Address required' });

  const prompt = `You are a Warsaw real estate intelligence assistant. Search the web for information about this address: "${address}", Warsaw, Poland.

Search for:
- Apartments for SALE at or near this address on Otodom, Gratka, Adresowo, OLX
- Apartments for LONG-TERM RENT (monthly) at or near this address on Otodom, OLX, Gratka
- Apartments for SHORT-TERM RENT (nightly) at or near this address on Booking.com, Airbnb, Trip.com
- Building info: year built, floors, number of units, developer, district
- Ownership info if publicly available

Return ONLY a valid JSON object, no markdown, no explanation, no code blocks:

{
  "building_info": {
    "district": "district name",
    "year": "construction year or null",
    "floors": "number of floors or null",
    "style": "e.g. modernist tenement, new residential block, prewar tenement",
    "total_units": "number of apartments or null",
    "developer": "developer name if known, else null",
    "notes": "avg price per m2, nearby landmarks, transport links, key facts"
  },
  "sale_listings": [
    {
      "title": "listing title",
      "size": "e.g. 65 m²",
      "rooms": "e.g. 3 rooms",
      "floor": "e.g. 3rd floor",
      "price": "price in PLN",
      "source": "Otodom / Gratka / Adresowo / etc",
      "url": "direct listing URL or null",
      "photos": ["photo url 1", "photo url 2"]
    }
  ],
  "long_term_rentals": [
    {
      "title": "listing title",
      "size": "e.g. 45 m²",
      "rooms": "e.g. 2 rooms",
      "floor": "e.g. 2nd floor",
      "price": "monthly price in PLN",
      "source": "OLX / Otodom / etc",
      "url": "direct listing URL or null",
      "photos": ["photo url 1"]
    }
  ],
  "short_term_rentals": [
    {
      "title": "listing title",
      "size": "e.g. 35 m²",
      "rating": 4.7,
      "reviews": 42,
      "price": "price per night in PLN or USD",
      "source": "Booking.com / Airbnb / Trip.com / etc",
      "url": "direct listing URL or null",
      "photos": ["photo url 1"]
    }
  ],
  "ownership": [
    {
      "name": "owner name or company",
      "share": "ownership share if known",
      "since": "year if known",
      "type": "Natural person / Legal entity"
    }
  ]
}

If no listings found at the exact address, include nearby ones on the same street and mention it in notes. Always include real URLs and photo URLs when found.`;

  try {
    const apiKey = process.env.GEMINI_API_KEY;
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;

    const body = {
      contents: [{ parts: [{ text: prompt }] }],
      tools: [{ google_search: {} }],
      generationConfig: {
        temperature: 0.1,
        maxOutputTokens: 4000,
      }
    };

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      const msg = err.error?.message || `Gemini API error ${response.status}`;
      return res.status(response.status).json({ error: msg });
    }

    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts
      ?.filter(p => p.text)
      ?.map(p => p.text)
      ?.join('') || '';

    if (!text) return res.status(500).json({ error: 'No response from Gemini' });

    const clean = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    const start = clean.indexOf('{');
    const end = clean.lastIndexOf('}');
    if (start === -1) return res.status(500).json({ error: 'Could not parse results for this address.' });

    const parsed = JSON.parse(clean.slice(start, end + 1));
    return res.status(200).json(parsed);

  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
