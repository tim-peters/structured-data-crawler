import { StructuredDataItem } from '../types/crawler';
import CryptoJS from 'crypto-js';

export function extractStructuredData(html: string, url: string): StructuredDataItem[] {
  const results: StructuredDataItem[] = [];

  // Extract JSON-LD
  results.push(...extractJsonLd(html, url));
  
  // Extract Microdata
  results.push(...extractMicrodata(html, url));
  
  // Extract RDFa
  results.push(...extractRdfa(html, url));
  
  // Extract OpenGraph
  results.push(...extractOpenGraph(html, url));
  
  // Extract Twitter Cards
  results.push(...extractTwitterCards(html, url));

  return results;
}

function generateDataHash(data: any): string {
  // Create a normalized version of the data for hashing
  const normalized = JSON.stringify(data, Object.keys(data).sort());
  return CryptoJS.MD5(normalized).toString().substring(0, 8);
}

function extractId(data: any): string | undefined {
  // Try to find an ID in various formats
  return data['@id'] || 
         data.id || 
         data.itemid || 
         data.url || 
         data.sameAs || 
         data.mainEntityOfPage ||
         undefined;
}

function extractJsonLd(html: string, url: string): StructuredDataItem[] {
  const results: StructuredDataItem[] = [];
  const scriptRegex = /<script[^>]*type=["']application\/ld\+json["'][^>]*>(.*?)<\/script>/gis;
  let match;

  while ((match = scriptRegex.exec(html)) !== null) {
    try {
      const jsonContent = match[1].trim();
      if (!jsonContent) continue;
      
      const data = JSON.parse(jsonContent);
      
      // Handle arrays of structured data
      const items = Array.isArray(data) ? data : [data];
      
      items.forEach(item => {
        if (item && typeof item === 'object') {
          const hash = generateDataHash(item);
          const id = extractId(item);
          
          results.push({
            url,
            format: 'JSON-LD',
            type: item['@type'] || (item['@graph'] ? 'Graph' : 'Unknown'),
            data: item,
            id,
            hash
          });
        }
      });
    } catch (err) {
      console.warn('Failed to parse JSON-LD:', err);
    }
  }

  return results;
}

function extractMicrodata(html: string, url: string): StructuredDataItem[] {
  const results: StructuredDataItem[] = [];
  
  // Create a DOM parser to properly extract microdata
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');
  
  // Find all elements with itemscope
  const itemscopeElements = doc.querySelectorAll('[itemscope]');
  
  itemscopeElements.forEach((element, index) => {
    const itemtype = element.getAttribute('itemtype');
    const itemid = element.getAttribute('itemid');
    
    // Extract properties
    const properties: Record<string, any> = {};
    const propElements = element.querySelectorAll('[itemprop]');
    
    propElements.forEach(propEl => {
      const propName = propEl.getAttribute('itemprop');
      if (!propName) return;
      
      let propValue: string | null = null;
      
      // Get value based on element type
      if (propEl.hasAttribute('content')) {
        propValue = propEl.getAttribute('content');
      } else if (propEl.tagName === 'META') {
        propValue = propEl.getAttribute('content');
      } else if (propEl.tagName === 'A' || propEl.tagName === 'LINK') {
        propValue = propEl.getAttribute('href');
      } else if (propEl.tagName === 'IMG') {
        propValue = propEl.getAttribute('src');
      } else if (propEl.tagName === 'TIME') {
        propValue = propEl.getAttribute('datetime') || propEl.textContent?.trim() || null;
      } else {
        propValue = propEl.textContent?.trim() || null;
      }
      
      if (propValue) {
        if (properties[propName]) {
          // Handle multiple values
          if (Array.isArray(properties[propName])) {
            properties[propName].push(propValue);
          } else {
            properties[propName] = [properties[propName], propValue];
          }
        } else {
          properties[propName] = propValue;
        }
      }
    });
    
    if (Object.keys(properties).length > 0 || itemtype) {
      const data: any = { ...properties };
      if (itemtype) data.itemtype = itemtype;
      if (itemid) data.itemid = itemid;
      
      const hash = generateDataHash(data);
      const id = extractId(data);
      
      results.push({
        url,
        format: 'Microdata',
        type: itemtype ? itemtype.split('/').pop() || 'Unknown' : 'Unknown',
        data,
        id,
        hash
      });
    }
  });

  return results;
}

function extractRdfa(html: string, url: string): StructuredDataItem[] {
  const results: StructuredDataItem[] = [];
  
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');
  
  // Find elements with RDFa attributes
  const rdfaElements = doc.querySelectorAll('[typeof], [property], [resource], [about]');
  
  const processedElements = new Set();
  
  rdfaElements.forEach((element, index) => {
    if (processedElements.has(element)) return;
    
    const typeof_ = element.getAttribute('typeof');
    const about = element.getAttribute('about');
    const resource = element.getAttribute('resource');
    
    if (typeof_) {
      const properties: Record<string, any> = {};
      
      // Find all property elements within this scope
      const propertyElements = element.querySelectorAll('[property]');
      propertyElements.forEach(propEl => {
        const property = propEl.getAttribute('property');
        const content = propEl.getAttribute('content') || propEl.textContent?.trim();
        
        if (property && content) {
          properties[property] = content;
        }
      });
      
      const data: any = {
        '@type': typeof_,
        ...properties
      };
      
      if (about) data['@about'] = about;
      if (resource) data['@resource'] = resource;
      
      const hash = generateDataHash(data);
      const id = extractId(data);
      
      results.push({
        url,
        format: 'RDFa',
        type: typeof_.split('/').pop() || typeof_,
        data,
        id,
        hash
      });
      
      processedElements.add(element);
    }
  });

  return results;
}

function extractOpenGraph(html: string, url: string): StructuredDataItem[] {
  const results: StructuredDataItem[] = [];
  const ogData: Record<string, string> = {};
  
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');
  
  const ogElements = doc.querySelectorAll('meta[property^="og:"]');
  
  ogElements.forEach(element => {
    const property = element.getAttribute('property');
    const content = element.getAttribute('content');
    
    if (property && content) {
      const key = property.replace('og:', '');
      ogData[key] = content;
    }
  });

  if (Object.keys(ogData).length > 0) {
    const hash = generateDataHash(ogData);
    const id = extractId(ogData);
    
    results.push({
      url,
      format: 'OpenGraph',
      type: 'OpenGraph',
      data: ogData,
      id,
      hash
    });
  }

  return results;
}

function extractTwitterCards(html: string, url: string): StructuredDataItem[] {
  const results: StructuredDataItem[] = [];
  const twitterData: Record<string, string> = {};
  
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');
  
  const twitterElements = doc.querySelectorAll('meta[name^="twitter:"]');
  
  twitterElements.forEach(element => {
    const name = element.getAttribute('name');
    const content = element.getAttribute('content');
    
    if (name && content) {
      const key = name.replace('twitter:', '');
      twitterData[key] = content;
    }
  });

  if (Object.keys(twitterData).length > 0) {
    const hash = generateDataHash(twitterData);
    const id = extractId(twitterData);
    
    results.push({
      url,
      format: 'Twitter Cards',
      type: 'TwitterCard',
      data: twitterData,
      id,
      hash
    });
  }

  return results;
}