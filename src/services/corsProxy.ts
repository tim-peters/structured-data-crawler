// CORS proxy service for fetching external URLs
export async function fetchThroughProxy(url: string): Promise<string> {
  // Try direct fetch first (will work for CORS-enabled sites)
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'StructuredDataCrawler/1.0',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      },
      mode: 'cors'
    });
    
    if (response.ok) {
      return await response.text();
    }
  } catch (corsError) {
    // CORS failed, try alternative approaches
  }

  // Try using a public CORS proxy as fallback
  const proxyUrls = [
    `https://api.allorigins.win/get?url=${encodeURIComponent(url)}`,
    `https://corsproxy.io/?${encodeURIComponent(url)}`
  ];

  for (const proxyUrl of proxyUrls) {
    try {
      const response = await fetch(proxyUrl);
      if (response.ok) {
        const data = await response.json();
        return data.contents || data;
      }
    } catch (err) {
      continue; // Try next proxy
    }
  }

  throw new Error(`Unable to fetch ${url} due to CORS restrictions`);
}