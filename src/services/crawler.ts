import { StructuredDataItem } from '../types/crawler';
import { CrawlOptions } from '../components/CrawlerForm';
import { extractStructuredData } from './structuredDataExtractor';
import { parseRobotsTxt } from './robotsParser';
import { fetchThroughProxy } from './corsProxy';

function normalizeUrl(url: string): string {
  try {
    const urlObj = new URL(url);
    
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
      // Remove trailing slash from non-root paths
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

export async function crawlDomain(
  domain: string,
  options: CrawlOptions,
  callbacks: CrawlCallbacks
): Promise<void> {
  const { onProgress, onData, signal } = callbacks;
  
  // Normalize domain
  const baseUrl = normalizeUrl(domain.startsWith('http') ? domain : `https://${domain}`);
  const urlObj = new URL(baseUrl);
  const baseDomain = urlObj.hostname.startsWith('www.') ? urlObj.hostname.substring(4) : urlObj.hostname;

  const state: CrawlState = {
    visited: new Set(),
    queue: [{ url: baseUrl, depth: 0 }],
    pagesCrawled: 0,
    structuredDataFound: 0,
    robotsRules: new Map()
  };

  // Load robots.txt if respecting robots
  if (options.respectRobots) {
    try {
      const robotsUrl = `${urlObj.protocol}//${urlObj.host}/robots.txt`;
      const robotsResponse = await fetchWithTimeout(robotsUrl, 5000);
      if (robotsResponse.ok) {
        const robotsText = await robotsResponse.text();
        state.robotsRules = parseRobotsTxt(robotsText);
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

      const html = await fetchPage(url);
      
      // Check for canonical URL and use it if different
      const canonicalUrl = extractCanonicalUrl(html, url);
      const finalUrl = canonicalUrl !== url ? canonicalUrl : url;
      
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
          const normalizedLink = normalizeUrl(link);
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

async function fetchPage(url: string): Promise<string> {
  try {
    // Try direct fetch first
    const response = await fetchWithTimeout(url, 10000);
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const contentType = response.headers.get('content-type') || '';
    if (!contentType.includes('text/html')) {
      throw new Error('Response is not HTML');
    }

    return await response.text();
  } catch (err) {
    // If direct fetch fails due to CORS, try proxy
    console.warn(`Direct fetch failed for ${url}, trying proxy...`);
    return await fetchThroughProxy(url);
  }
}

async function fetchWithTimeout(url: string, timeout: number): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'StructuredDataCrawler/1.0',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'Cache-Control': 'no-cache'
      },
      mode: 'cors'
    });
    
    clearTimeout(timeoutId);
    return response;
  } catch (err) {
    clearTimeout(timeoutId);
    throw err;
  }
}

function extractLinks(html: string, baseUrl: string, baseDomain: string): string[] {
  const links: string[] = [];
  const linkRegex = /<a[^>]+href=["']([^"']+)["'][^>]*>/gi;
  let match;

  while ((match = linkRegex.exec(html)) !== null) {
    try {
      const href = match[1];
      let absoluteUrl: string;

      if (href.startsWith('http')) {
        absoluteUrl = href;
      } else if (href.startsWith('/')) {
        const baseUrlObj = new URL(baseUrl);
        absoluteUrl = `${baseUrlObj.protocol}//${baseUrlObj.host}${href}`;
      } else if (href.startsWith('#') || href.startsWith('mailto:') || href.startsWith('tel:')) {
        continue; // Skip anchors and non-http links
      } else {
        absoluteUrl = new URL(href, baseUrl).href;
      }

      const normalizedUrl = normalizeUrl(absoluteUrl);
      const urlObj = new URL(normalizedUrl);
      const urlDomain = urlObj.hostname.startsWith('www.') ? urlObj.hostname.substring(4) : urlObj.hostname;
      
      // Only crawl same domain
      if (urlDomain === baseDomain) {
        if (!links.includes(normalizedUrl)) {
          links.push(normalizedUrl);
        }
      }
    } catch (err) {
      // Skip invalid URLs
      continue;
    }
  }

  return links;
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