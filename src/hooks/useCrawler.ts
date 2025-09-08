import { useState, useCallback, useRef } from 'react';
import { StructuredDataItem, CrawlStats, StructuredDataSnippet } from '../types/crawler';
import { CrawlOptions } from '../components/CrawlerForm';
import { crawlDomain } from '../services/crawler';
import { groupStructuredData } from '../services/dataGrouper';

export function useCrawler() {
  const [crawlData, setCrawlData] = useState<StructuredDataItem[]>([]);
  const [snippetData, setSnippetData] = useState<StructuredDataSnippet[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<CrawlStats | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const startCrawl = useCallback(async (domain: string, options: CrawlOptions) => {
    setIsLoading(true);
    setError(null);
    setCrawlData([]);
    setSnippetData([]);
    setStats({
      pagesCrawled: 0,
      structuredDataFound: 0,
      duration: 0,
      status: 'running'
    });

    // Create abort controller for this crawl
    abortControllerRef.current = new AbortController();
    const startTime = Date.now();

    try {
      const results: StructuredDataItem[] = [];
      
      // Progress callback to update stats
      const onProgress = (pagesCrawled: number, structuredDataFound: number) => {
        setStats({
          pagesCrawled,
          structuredDataFound,
          duration: Date.now() - startTime,
          status: 'running'
        });
        setCrawlData([...results]);
      };

      // Data callback to add new structured data
      const onData = (newData: StructuredDataItem[]) => {
        results.push(...newData);
        setCrawlData([...results]);
        setSnippetData(groupStructuredData([...results]));
      };

      await crawlDomain(domain, options, {
        onProgress,
        onData,
        signal: abortControllerRef.current.signal
      });

      setStats(prev => prev ? {
        ...prev,
        duration: Date.now() - startTime,
        status: 'completed'
      } : null);

    } catch (err: any) {
      if (err.name === 'AbortError') {
        setStats(prev => prev ? {
          ...prev,
          duration: Date.now() - startTime,
          status: 'stopped'
        } : null);
      } else {
        setError(err.message || 'An error occurred during crawling');
        setStats(prev => prev ? {
          ...prev,
          duration: Date.now() - startTime,
          status: 'error'
        } : null);
      }
    } finally {
      setIsLoading(false);
      abortControllerRef.current = null;
    }
  }, []);

  const stopCrawl = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
  }, []);

  return {
    crawlData,
    snippetData,
    isLoading,
    error,
    stats,
    startCrawl,
    stopCrawl
  };
}