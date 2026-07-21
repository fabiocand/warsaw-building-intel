export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { address } = req.body || {};
  if (!address) return res.status(400).json({ error: 'Address required' });

  const prompt = `You are a Warsaw real estate intelligence assistant. Search the web for information about: "${address}", Warsaw, Poland.

Return ONLY a valid JSON object, no markdown, no explanation:

{
  "building_info": {
    "district": "district name",
    "year": "construction year or null",
    "floors": "number of floors or null",
    "style": "e.g. modernist tenement, new residential block",
    "total_units": "number of apartments or null",
    "developer": "developer name if known, else null",
    "notes": "avg price per m2, nearby landmarks, transport links"
  },
  "sale_listings": [
    { "title": "", "size": "", "rooms": "", "floor": "", "price": "", "source": "", "url": "", "photos": [] }
  ],
  "long_term_rentals": [
    { "title": "", "size": "", "rooms": "", "floor": "", "price": "", "source": "", "url": "", "photos": [] }
  ],
  "short_term_rentals": [
    { "title": "", "size": "", "rating": 0, "reviews": 0, "price": "", "source": "", "url": "", "photos": [] }
  ],
  "ownership": [
    { "name": "", "share": "", "since": "", "type": "" }
  ]
}

Search Otodom, OLX, Gratka, Adresowo for sales and rentals. Search Booking.com, Airbnb, Trip.com for short stays. Include photo URLs from listings. If no exact match, include nearby listings with a note. Return only JSON.`;

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 4000,
        tools: [{ type: 'web_search_20250305', name: 'web_search' }],
        messages: [{ role: 'user', content: prompt }]
      })
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      return res.status(response.status).json({ error: err.error?.message || 'Anthropic API error' });
    }

    const data = await response.json();
    const text = (data.content || []).filter(b => b.type === 'text').map(b => b.text).join('');
    const clean = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    const start = clean.indexOf('{');
    const end = clean.lastIndexOf('}');
    if (start === -1) return res.status(500).json({ error: 'No structured results returned' });

    const parsed = JSON.parse(clean.slice(start, end + 1));
    return res.status(200).json(parsed);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
