import { StructuredDataItem } from '../types/crawler';
import { CrawlOptions } from '../components/CrawlerForm';
import { extractStructuredData } from './structuredDataExtractor';
import { parseRobotsTxt } from './robotsParser';

function normalizeUrl(url: string, forceHttpsForDomain?: string): string {
  try {
    const urlObj = new URL(url);

    // Force HTTPS for the main domain if requested
    if (
      forceHttpsForDomain &&
      (urlObj.hostname === forceHttpsForDomain || urlObj.hostname === 'www.' + forceHttpsForDomain)
    ) {
      urlObj.protocol = 'https:';
    }

    // Remove www. prefix from hostname
    if (urlObj.hostname.startsWith('www.')) {
      urlObj.hostname = urlObj.hostname.substring(4);
    }
    
    // Remove fragment
    urlObj.hash = '';
    
    // Normalize path - ensure trailing slash for root, remove for others
    if (urlObj.pathname === '' || urlObj.pathname === '/') {
      urlObj.pathname = '/';
    } else {
      urlObj.pathname = urlObj.pathname.replace(/\/$/, '');
    }
    
    // Sort query parameters for consistency
    if (urlObj.search) {
      const params = new URLSearchParams(urlObj.search);
      const sortedParams = new URLSearchParams();
      Array.from(params.keys()).sort().forEach(key => {
        params.getAll(key).forEach(value => {
          sortedParams.append(key, value);
        });
      });
      urlObj.search = sortedParams.toString();
    }
    
    return urlObj.href;
  } catch (err) {
    // If URL parsing fails, return original
    return url;
  }
}

function extractCanonicalUrl(html: string, currentUrl: string): string {
  try {
    // Look for canonical link tag
    const canonicalMatch = html.match(/<link[^>]+rel=["']canonical["'][^>]*href=["']([^"']+)["'][^>]*>/i);
    if (canonicalMatch) {
      const canonicalUrl = canonicalMatch[1];
      // Convert relative URLs to absolute
      if (canonicalUrl.startsWith('http')) {
        return normalizeUrl(canonicalUrl);
      } else {
        return normalizeUrl(new URL(canonicalUrl, currentUrl).href);
      }
    }
  } catch (err) {
    // If parsing fails, fall back to current URL
  }
  
  return normalizeUrl(currentUrl);
}
interface CrawlCallbacks {
  onProgress: (pagesCrawled: number, structuredDataFound: number) => void;
  onData: (data: StructuredDataItem[]) => void;
  signal: AbortSignal;
}

interface CrawlState {
  visited: Set<string>;
  queue: Array<{ url: string; depth: number }>;
  pagesCrawled: number;
  structuredDataFound: number;
  robotsRules: Map<string, boolean>;
}

// Cache for domains that require CORS proxy
const corsProxyCache = new Map<string, boolean>();

// Cache for domains that work with direct fetch
const directFetchCache = new Map<string, boolean>();

// Local PHP proxy configuration
const LOCAL_PHP_PROXY =
  import.meta.env.MODE === 'production'
    ? '/proxy.php'
    : 'http://localhost:8000/proxy.php';

// List of public CORS proxies to try as fallback
const CORS_PROXIES = [
  'https://api.allorigins.win/get?url=',
  'https://corsproxy.io/?'
];

async function fetchWithCorsHandling(url: string, timeout: number = 10000): Promise<string> {
  const urlObj = new URL(url);
  const domain = urlObj.hostname;
  
  // Check if we know this domain requires CORS proxy (but not if we know direct fetch works)
  if (corsProxyCache.get(domain) && !directFetchCache.get(domain)) {
    return await fetchThroughProxies(url);
  }
  
  // Try direct fetch first
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);
    
    // Follow redirects automatically
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'StructuredDataCrawler/1.0',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'Cache-Control': 'no-cache'
      },
      mode: 'cors',
      redirect: 'follow'
    });
    
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const contentType = response.headers.get('content-type') || '';
    if (!contentType.includes('text/html')) {
      throw new Error('Response is not HTML');
    }

    // Mark this domain as working with direct fetch
    directFetchCache.set(domain, true);
    return await response.text();
  } catch (err: any) {
    // Only use proxy for actual CORS/network errors, not for HTTP errors like 404
    if ((err.name === 'TypeError' || err.message.includes('CORS') || err.message.includes('fetch')) 
        && !err.message.includes('HTTP')) {
      console.log(`CORS issue detected for ${domain}, switching to proxy`);
      directFetchCache.delete(domain); // Remove from direct fetch cache
      corsProxyCache.set(domain, true);
      return await fetchThroughProxies(url);
    }
    throw err;
  }
}

function normalizeDomainInput(input: string): { baseUrl: string; baseDomain: string; startPath?: string } {
  let cleanInput = input.trim().toLowerCase();
  
  // Remove protocol if present
  cleanInput = cleanInput.replace(/^https?:\/\//, '');
  
  // Extract path if present
  const pathMatch = cleanInput.match(/^([^\/]+)(\/.*)?$/);
  const domainPart = pathMatch ? pathMatch[1] : cleanInput;
  const pathPart = pathMatch ? pathMatch[2] : undefined;
  
  // Remove www. prefix for base domain
  const baseDomain = domainPart.replace(/^www\./, '');
  
  // Always use HTTPS for the base URL
  const baseUrl = `https://${baseDomain}`;
  
  return { baseUrl, baseDomain, startPath: pathPart };
}

async function fetchThroughLocalProxy(url: string): Promise<string> {
  const proxyUrl = `${LOCAL_PHP_PROXY}?csurl=${encodeURIComponent(url)}`;
  const response = await fetch(proxyUrl, {
    method: 'GET'
    // No custom headers required for basic proxy usage
  });

  if (!response.ok) {
    throw new Error(`Local PHP proxy failed with status: ${response.status}`);
  }

  return await response.text();
}

async function fetchThroughPublicProxies(url: string): Promise<string> {
  const encodedUrl = encodeURIComponent(url);
  
  for (const proxyBase of CORS_PROXIES) {
    try {
      const proxyUrl = proxyBase + encodedUrl;
      const response = await fetch(proxyUrl, {
        headers: {
          'Accept': 'application/json,text/html,*/*',
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        // Handle different proxy response formats
        if (data.contents) {
          return data.contents; // allorigins format
        } else if (typeof data === 'string') {
          return data; // corsproxy format
        } else if (data.data) {
          return data.data;
        }
      }
    } catch (err) {
      console.warn(`Proxy ${proxyBase} failed for ${url}:`, err);
      continue; // Try next proxy
    }
  }
  
  throw new Error(`All CORS proxies failed for ${url}`);
}

async function fetchThroughProxies(url: string): Promise<string> {
  // First try local PHP proxy
  try {
    return await fetchThroughLocalProxy(url);
  } catch (err) {
    console.warn(`Local PHP proxy failed, trying public proxies for ${url}`);
  }
  
  // Fall back to public proxies
  return await fetchThroughPublicProxies(url);
}

export async function crawlDomain(
  domain: string,
  options: CrawlOptions,
  callbacks: CrawlCallbacks
): Promise<void> {
  const { onProgress, onData, signal } = callbacks;

  // Normalize the input domain
  const { baseUrl, baseDomain, startPath } = normalizeDomainInput(domain);
  
  // Determine starting URL - use specific path if provided, otherwise use root
  const startingUrl = startPath ? normalizeUrl(`${baseUrl}${startPath}`, baseDomain) : baseUrl;
  
  const urlObj = new URL(startingUrl);

  const state: CrawlState = {
    visited: new Set(),
    queue: [{ url: startingUrl, depth: 0 }],
    pagesCrawled: 0,
    structuredDataFound: 0,
    robotsRules: new Map()
  };

  // Load robots.txt if respecting robots
  if (options.respectRobots) {
    try {
      const robotsUrl = `https://${baseDomain}/robots.txt`;
      try {
        const robotsText = await fetchWithCorsHandling(robotsUrl, 5000);
        state.robotsRules = parseRobotsTxt(robotsText);
      } catch (err) {
        // If robots.txt fails, continue without it
        console.warn('Could not fetch robots.txt:', err);
      }
    } catch (err) {
      console.warn('Could not fetch robots.txt:', err);
    }
  }

  while (state.queue.length > 0 && state.pagesCrawled < options.maxPages) {
    if (signal.aborted) {
      throw new Error('Crawl was aborted');
    }

    const { url, depth } = state.queue.shift()!;

    // Skip if already visited or depth exceeded
    if (state.visited.has(url) || depth > options.maxDepth) {
      continue;
    }

    // Check robots.txt
    if (options.respectRobots && !isAllowedByRobots(url, state.robotsRules)) {
      continue;
    }

    try {
      // Add delay between requests
      if (state.pagesCrawled > 0) {
        await new Promise(resolve => setTimeout(resolve, options.delay));
      }

      const html = await fetchWithCorsHandling(url);
      
      // Check for canonical URL and use it if different (but keep same domain)
      const canonicalUrl = extractCanonicalUrl(html, url);
      let finalUrl = url;
      
      // Only use canonical URL if it's from the same domain
      if (canonicalUrl !== url) {
        try {
          const canonicalDomain = new URL(canonicalUrl).hostname.replace(/^www\./, '');
          if (canonicalDomain === baseDomain) {
            finalUrl = canonicalUrl;
          }
        } catch (err) {
          // If canonical URL is invalid, stick with original
        }
      }
      
      // Skip if we've already processed the canonical version
      if (state.visited.has(finalUrl)) {
        continue;
      }
      
      state.visited.add(finalUrl);
      state.visited.add(url); // Also mark the original URL as visited
      state.pagesCrawled++;

      // Extract structured data
      const structuredData = extractStructuredData(html, finalUrl);
      if (structuredData.length > 0) {
        state.structuredDataFound += structuredData.length;
        onData(structuredData);
      }

      // Extract links for next level crawling
      if (depth < options.maxDepth) {
        const links = extractLinks(html, finalUrl, baseDomain);
        for (const link of links) {
          const normalizedLink = normalizeUrl(link, baseDomain);
          if (!state.visited.has(normalizedLink) && state.queue.length < 1000) {
            state.queue.push({ url: normalizedLink, depth: depth + 1 });
          }
        }
      }

      onProgress(state.pagesCrawled, state.structuredDataFound);

    } catch (err) {
      console.warn(`Failed to crawl ${url}:`, err);
      // Continue with next URL instead of failing completely
    }
  }
}

function extractLinks(html: string, baseUrl: string, baseDomain: string): string[] {
  // Focus on href attributes for navigation links
  const linkRegex = /href\s*=\s*(?:"([^"]+)"|'([^']+)'|([^\s>"']+))/gi;
  const links: string[] = [];
  let match: RegExpExecArray | null;

  // File extensions that typically don't contain links
  const nonLinkExtensions = [
    '.css', '.js', '.csv', '.xml', '.json',
    '.pdf', '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx',
    '.zip', '.rar', '.7z', '.tar', '.gz',
    '.jpg', '.jpeg', '.png', '.svg', '.gif', '.bmp', '.webp', '.ico',
    '.mp3', '.mp4', '.wav', '.avi', '.mov', '.wmv',
    '.ttf', '.woff', '.woff2', '.eot', '.otf'
  ];

  while ((match = linkRegex.exec(html)) !== null) {
    const url = match[1] || match[2] || match[3];
    if (!url) continue;
    
    // Ignore anchors and javascript
    if (url.startsWith('#') || url.startsWith('mailto:') || url.startsWith('javascript:') || url.startsWith('tel:')) continue;
    
    // Check if URL has a file extension that doesn't contain links
    const urlLower = url.toLowerCase();
    const hasNonLinkExtension = nonLinkExtensions.some(ext => urlLower.endsWith(ext));
    if (hasNonLinkExtension) continue;
    
    // Normalize relative URLs
    let absoluteUrl = url;
    try {
      absoluteUrl = new URL(url, baseUrl).href;
    } catch {
      // skip invalid URLs
      continue;
    }
    
    // Only include links from the same domain
    try {
      const linkDomain = new URL(absoluteUrl).hostname.replace(/^www\./, '');
      if (linkDomain === baseDomain || linkDomain === `www.${baseDomain}`) {
        links.push(absoluteUrl);
      }
    } catch {
      continue;
    }
  }

  // Remove duplicates
  return Array.from(new Set(links));
}

function isAllowedByRobots(url: string, robotsRules: Map<string, boolean>): boolean {
  if (robotsRules.size === 0) return true;

  try {
    const urlObj = new URL(url);
    const path = urlObj.pathname;
    
    // Check each rule
    for (const [pattern, allowed] of robotsRules.entries()) {
      if (path.startsWith(pattern)) {
        return allowed;
      }
    }
    
    return true; // Default allow if no rules match
  } catch {
    return false;
  }
}