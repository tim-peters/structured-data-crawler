export interface StructuredDataItem {
  url: string;
  format: 'JSON-LD' | 'Microdata' | 'RDFa' | 'OpenGraph' | 'Twitter Cards' | 'Schema.org';
  type?: string;
  data: any;
  id?: string;
  hash: string;
}

export interface StructuredDataSnippet {
  hash: string;
  items: StructuredDataItem[];
  type?: string;
  format: string;
  connections: Connection[];
  duplicateCount: number;
}

export interface Connection {
  type: 'reference' | 'sameAs' | 'mainEntity' | 'about' | 'author' | 'publisher';
  targetId: string;
  targetHash?: string;
  property: string;
  value: string;
}

export interface CrawlStats {
  pagesCrawled: number;
  structuredDataFound: number;
  duration: number;
  status: 'running' | 'completed' | 'stopped' | 'error';
}

export interface CrawlResult {
  items: StructuredDataItem[];
  stats: CrawlStats;
}