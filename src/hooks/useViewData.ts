import { useMemo, useState, useEffect } from 'react';
import { StructuredDataItem, StructuredDataSnippet } from '../types/crawler';

export type ViewMode = 'byUrl' | 'byType' | 'bySnippet' | 'byOccurrence';

export function useViewData(
  filteredData: StructuredDataItem[],
  filteredSnippetData: StructuredDataSnippet[]
) {
  const [expandedCategories, setExpandedCategories] = useState<{ [key: string]: boolean }>({});

  // Create by type view data
  const byTypeData = useMemo(() => {
    const hierarchy: { [key: string]: StructuredDataSnippet[] } = {};
    filteredSnippetData.forEach(snippet => {
      const key = `${snippet.format} - ${snippet.type || 'Unknown'}`;
      if (!hierarchy[key]) {
        hierarchy[key] = [];
      }
      hierarchy[key].push(snippet);
    });
    return Object.entries(hierarchy).sort(([a], [b]) => a.localeCompare(b));
  }, [filteredSnippetData]);

  // Create by URL view data
  const byUrlData = useMemo(() => {
    const urlGroups: { [key: string]: StructuredDataItem[] } = {};
    filteredData.forEach(item => {
      if (!urlGroups[item.url]) {
        urlGroups[item.url] = [];
      }
      urlGroups[item.url].push(item);
    });
    return Object.entries(urlGroups).sort(([a], [b]) => a.localeCompare(b));
  }, [filteredData]);

  // Set all categories expanded by default when data changes
  useEffect(() => {
    const initial: { [key: string]: boolean } = {};
    byTypeData.forEach(([categoryKey]) => {
      initial[categoryKey] = true;
    });
    byUrlData.forEach(([url]) => {
      initial[url] = true;
    });
    setExpandedCategories(initial);
  }, [byTypeData, byUrlData]);

  const toggleCategory = (key: string) => {
    setExpandedCategories(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  return {
    byTypeData,
    byUrlData,
    expandedCategories,
    toggleCategory
  };
}