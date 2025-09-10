import { useMemo } from 'react';
import { StructuredDataItem, StructuredDataSnippet } from '../types/crawler';

export interface FilterOptions {
  searchTerm: string;
  selectedType: string;
  selectedFormat: string;
}

export function useFilteredData(
  data: StructuredDataItem[],
  snippetData: StructuredDataSnippet[],
  filters: FilterOptions
) {
  const filteredData = useMemo(() => {
    return data.filter(item => {
      const matchesSearch = filters.searchTerm === '' || 
        item.url.toLowerCase().includes(filters.searchTerm.toLowerCase()) ||
        item.type?.toLowerCase().includes(filters.searchTerm.toLowerCase()) ||
        JSON.stringify(item.data).toLowerCase().includes(filters.searchTerm.toLowerCase());
      
      const matchesType = filters.selectedType === 'all' || item.type === filters.selectedType;
      const matchesFormat = filters.selectedFormat === 'all' || item.format === filters.selectedFormat;
      
      return matchesSearch && matchesType && matchesFormat;
    });
  }, [data, filters.searchTerm, filters.selectedType, filters.selectedFormat]);

  const filteredSnippetData = useMemo(() => {
    return snippetData.filter(snippet => {
      const matchesSearch = filters.searchTerm === '' || 
        snippet.items.some(item => 
          item.url.toLowerCase().includes(filters.searchTerm.toLowerCase()) ||
          item.type?.toLowerCase().includes(filters.searchTerm.toLowerCase()) ||
          JSON.stringify(item.data).toLowerCase().includes(filters.searchTerm.toLowerCase())
        );
      
      const matchesType = filters.selectedType === 'all' || snippet.type === filters.selectedType;
      const matchesFormat = filters.selectedFormat === 'all' || snippet.format === filters.selectedFormat;
      
      return matchesSearch && matchesType && matchesFormat;
    });
  }, [snippetData, filters.searchTerm, filters.selectedType, filters.selectedFormat]);

  const uniqueTypes = useMemo(() => {
    const typeSet = new Set<string>();
    data.forEach(item => {
      if (item.type) typeSet.add(item.type);
    });
    return Array.from(typeSet).sort();
  }, [data]);

  const uniqueFormats = useMemo(() => {
    const formatSet = new Set<string>();
    data.forEach(item => {
      formatSet.add(item.format);
    });
    return Array.from(formatSet).sort();
  }, [data]);

  return {
    filteredData,
    filteredSnippetData,
    uniqueTypes,
    uniqueFormats
  };
}