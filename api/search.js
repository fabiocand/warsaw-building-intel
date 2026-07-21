export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { address } = req.body || {};
  if (!address) return res.status(400).json({ error: 'Address required' });

  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) return res.status(500).json({ error: 'OPENROUTER_API_KEY not set in Vercel environment variables.' });

  const prompt = `Search the web for real estate listings at "${address}" Warsaw Poland. Return only JSON, no markdown:
{"building_info":{"district":"","year":"","floors":"","style":"","total_units":"","developer":"","notes":""},"sale_listings":[{"title":"","size":"","rooms":"","floor":"","price":"","source":"","url":"","photos":[]}],"long_term_rentals":[{"title":"","size":"","rooms":"","floor":"","price":"","source":"","url":"","photos":[]}],"short_term_rentals":[{"title":"","size":"","rating":0,"reviews":0,"price":"","source":"","url":"","photos":[]}],"ownership":[{"name":"","share":"","since":"","type":""}]}
Search Otodom OLX Gratka for sales and rentals. Search Airbnb Booking.com for short stays. Return only JSON.`;

  const models = [
    'qwen/qwen3-235b-a22b:free',
    'meta-llama/llama-3.3-70b-instruct:free',
    'deepseek/deepseek-chat:free',
    'microsoft/mai-ds-r1:free',
    'amazon/nova-2-lite-v1:free',
    'nousresearch/hermes-3-llama-3.1-405b:free'
  ];

  let lastError = 'All free models unavailable. Try again in a few minutes.';

  for (const model of models) {
    try {
      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
          'HTTP-Referer': 'https://warsaw-building-intel.vercel.app',
          'X-Title': 'Warsaw Building Intelligence'
        },
        body: JSON.stringify({
          model,
          messages: [{ role: 'user', content: prompt }],
          temperature: 0.1,
          max_tokens: 2000
        })
      });

      const data = await response.json();

      if (!response.ok) {
        lastError = data?.error?.message || `Model ${model} failed`;
        continue;
      }

      const text = data.choices?.[0]?.message?.content || '';
      if (!text) { lastError = `No text from ${model}`; continue; }

      const clean = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      const start = clean.indexOf('{');
      const end = clean.lastIndexOf('}');
      if (start === -1) { lastError = `No JSON from ${model}`; continue; }

      const parsed = JSON.parse(clean.slice(start, end + 1));
      return res.status(200).json(parsed);

    } catch (err) {
      lastError = err.message;
      continue;
    }
  }

  return res.status(500).json({ error: lastError });
}
