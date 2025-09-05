import { StructuredDataItem } from '../types/crawler';
import { CrawlOptions } from '../components/CrawlerForm';

interface CrawlCallbacks {
  onProgress: (pagesCrawled: number, structuredDataFound: number) => void;
  onData: (data: StructuredDataItem[]) => void;
  signal: AbortSignal;
}

// Mock crawler for demonstration purposes
export async function crawlDomain(
  domain: string,
  options: CrawlOptions,
  callbacks: CrawlCallbacks
): Promise<void> {
  const { onProgress, onData, signal } = callbacks;
  
  // Simulate crawling with mock data
  const mockPages = [
    { url: `${domain}`, depth: 0 },
    { url: `${domain}/about`, depth: 1 },
    { url: `${domain}/products`, depth: 1 },
    { url: `${domain}/products/item-1`, depth: 2 },
    { url: `${domain}/products/item-2`, depth: 2 },
    { url: `${domain}/blog`, depth: 1 },
    { url: `${domain}/blog/post-1`, depth: 2 },
    { url: `${domain}/contact`, depth: 1 }
  ];

  const mockStructuredData: StructuredDataItem[] = [
    {
      url: `${domain}`,
      format: 'JSON-LD',
      type: 'Organization',
      data: {
        '@context': 'https://schema.org',
        '@type': 'Organization',
        'name': 'Example Company',
        'url': domain,
        'logo': `${domain}/logo.png`,
        'contactPoint': {
          '@type': 'ContactPoint',
          'telephone': '+1-555-123-4567',
          'contactType': 'customer service'
        }
      }
    },
    {
      url: `${domain}`,
      format: 'OpenGraph',
      type: 'OpenGraph',
      data: {
        'title': 'Example Company - Leading Solutions',
        'description': 'We provide innovative solutions for modern businesses',
        'image': `${domain}/og-image.jpg`,
        'url': domain,
        'type': 'website'
      }
    },
    {
      url: `${domain}/products/item-1`,
      format: 'JSON-LD',
      type: 'Product',
      data: {
        '@context': 'https://schema.org',
        '@type': 'Product',
        'name': 'Premium Widget',
        'description': 'High-quality widget for professional use',
        'sku': 'WIDGET-001',
        'brand': {
          '@type': 'Brand',
          'name': 'Example Company'
        },
        'offers': {
          '@type': 'Offer',
          'price': '99.99',
          'priceCurrency': 'USD',
          'availability': 'https://schema.org/InStock'
        }
      }
    },
    {
      url: `${domain}/blog/post-1`,
      format: 'JSON-LD',
      type: 'Article',
      data: {
        '@context': 'https://schema.org',
        '@type': 'Article',
        'headline': 'How to Choose the Right Widget',
        'author': {
          '@type': 'Person',
          'name': 'John Smith'
        },
        'datePublished': '2024-01-15',
        'dateModified': '2024-01-16',
        'publisher': {
          '@type': 'Organization',
          'name': 'Example Company'
        }
      }
    },
    {
      url: `${domain}/about`,
      format: 'Microdata',
      type: 'LocalBusiness',
      data: {
        itemtype: 'https://schema.org/LocalBusiness',
        element: '<div itemscope itemtype="https://schema.org/LocalBusiness">',
        index: 0
      }
    },
    {
      url: `${domain}/contact`,
      format: 'Twitter Cards',
      type: 'TwitterCard',
      data: {
        'card': 'summary',
        'site': '@examplecompany',
        'title': 'Contact Us - Example Company',
        'description': 'Get in touch with our team'
      }
    }
  ];

  let processedPages = 0;
  let foundData = 0;

  for (const page of mockPages.slice(0, Math.min(options.maxPages, mockPages.length))) {
    if (signal.aborted) {
      throw new Error('Crawl was aborted');
    }

    if (page.depth > options.maxDepth) {
      continue;
    }

    // Simulate processing time
    await new Promise(resolve => setTimeout(resolve, Math.max(options.delay / 2, 200)));

    processedPages++;

    // Check if this page has structured data
    const pageData = mockStructuredData.filter(item => item.url === page.url);
    if (pageData.length > 0) {
      foundData += pageData.length;
      onData(pageData);
    }

    onProgress(processedPages, foundData);
  }
}