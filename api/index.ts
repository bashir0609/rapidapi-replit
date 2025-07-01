import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  const { method, url } = req;
  
  try {
    // Route to your API endpoints
    if (url?.includes('/search') && method === 'POST') {
      return await handleSearch(req, res);
    }
    
    if (url?.includes('/analytics') && method === 'GET') {
      return await handleAnalytics(req, res);
    }
    
    if (url?.includes('/configurations') && method === 'GET') {
      return await handleConfigurations(req, res);
    }
    
    return res.status(404).json({ error: 'Endpoint not found' });
  } catch (error) {
    console.error('API Error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

async function handleSearch(req: VercelRequest, res: VercelResponse) {
  const { query, searchType, apiSource } = req.body;
  
  const rapidApiKey = process.env.RAPIDAPI_KEY;
  if (!rapidApiKey) {
    return res.status(500).json({ error: 'RapidAPI key not configured' });
  }
  
  // Your RapidAPI search logic here
  try {
    const results = await performRapidAPISearch(query, searchType, apiSource, rapidApiKey);
    return res.status(200).json(results);
  } catch (error) {
    return res.status(500).json({ error: 'Search failed' });
  }
}

async function handleAnalytics(req: VercelRequest, res: VercelResponse) {
  // Your analytics logic
  return res.status(200).json({ 
    usage: 'Analytics data',
    timestamp: new Date().toISOString()
  });
}

async function handleConfigurations(req: VercelRequest, res: VercelResponse) {
  // Your configurations logic
  return res.status(200).json({ 
    config: 'Configuration data',
    timestamp: new Date().toISOString()
  });
}

async function performRapidAPISearch(query: string, searchType: string, apiSource: string, apiKey: string) {
  // Implement your RapidAPI calls here
  const response = await fetch('https://website-contacts-scraper.p.rapidapi.com/scrape-contacts', {
    method: 'POST',
    headers: {
      'X-RapidAPI-Key': apiKey,
      'X-RapidAPI-Host': 'website-contacts-scraper.p.rapidapi.com',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ url: query })
  });
  
  return await response.json();
}
