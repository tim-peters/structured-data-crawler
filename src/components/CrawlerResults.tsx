import React, { useState, useMemo, useEffect } from 'react';
import { StructuredDataItem, StructuredDataSnippet } from '../types/crawler';
import { StructuredDataCard } from './StructuredDataCard';
import { StructuredDataSnippetCard } from './StructuredDataSnippetCard';
import { getSnippetIcon } from '../utils/iconUtils';
import { Filter, Search, Download, Eye, Group, List, TreePine, ChevronDown, ChevronRight, Globe } from 'lucide-react';

interface CrawlerResultsProps {
  data: StructuredDataItem[];
  snippetData: StructuredDataSnippet[];
}

export function CrawlerResults({ data, snippetData }: CrawlerResultsProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedFormat, setSelectedFormat] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'byUrl' | 'byType' | 'bySnippet' | 'byOccurrence'>('byUrl');
  
  // Get unique types and formats
  const { types, formats } = useMemo(() => {
    const typeSet = new Set<string>();
    const formatSet = new Set<string>();
    
    data.forEach(item => {
      if (item.type) typeSet.add(item.type);
      formatSet.add(item.format);
    });
    
    return {
      types: Array.from(typeSet).sort(),
      formats: Array.from(formatSet).sort()
    };
  }, [data]);

  // Filter data based on search and filters
  const filteredData = useMemo(() => {
    return data.filter(item => {
      const matchesSearch = searchTerm === '' || 
        item.url.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.type?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        JSON.stringify(item.data).toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesType = selectedType === 'all' || item.type === selectedType;
      const matchesFormat = selectedFormat === 'all' || item.format === selectedFormat;
      
      return matchesSearch && matchesType && matchesFormat;
    });
  }, [data, searchTerm, selectedType, selectedFormat]);

  // Filter grouped data
  const filteredSnippetData = useMemo(() => {
    return snippetData.filter(snippet => {
      const matchesSearch = searchTerm === '' || 
        snippet.items.some(item => 
          item.url.toLowerCase().includes(searchTerm.toLowerCase()) ||
          item.type?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          JSON.stringify(item.data).toLowerCase().includes(searchTerm.toLowerCase())
        );
      
      const matchesType = selectedType === 'all' || snippet.type === selectedType;
      const matchesFormat = selectedFormat === 'all' || snippet.format === selectedFormat;
      
      return matchesSearch && matchesType && matchesFormat;
    });
  }, [snippetData, searchTerm, selectedType, selectedFormat]);

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

  // Set all categories expanded by default
  const [expandedCategories, setExpandedCategories] = useState<{ [key: string]: boolean }>({});

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

  const exportData = () => {
    const exportObj = {
      crawledAt: new Date().toISOString(),
      totalItems: data.length,
      individualData: filteredData,
      snippetData: snippetData
    };
    
    const blob = new Blob([JSON.stringify(exportObj, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `structured-data-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const toggleCategory = (key: string) => {
    setExpandedCategories(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">
            Discovered Structured Data
          </h2>
          <p className="text-slate-600 mt-1">
            Found {data.length} occurrences
            {viewMode !== 'byOccurrence' && viewMode !== 'byUrl' && ` of ${snippetData.length} snippets`}
            {viewMode === 'byType' && ` (of ${byTypeData.length} types)`}
            {viewMode === 'byUrl' && ` across ${byUrlData.length} URLs`}
          </p>
        </div>
        <div className="flex items-center space-x-3">
          {/* View Mode Toggle */}
          <div className="flex items-center bg-slate-100 rounded-lg p-1">
            {/* By URL - NEW */}
            <button
              onClick={() => setViewMode('byUrl')}
              className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                viewMode === 'byUrl'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Globe className="w-4 h-4" />
              <span>By URL</span>
            </button>
            {/* By Type */}
            <button
              onClick={() => setViewMode('byType')}
              className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                viewMode === 'byType'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <TreePine className="w-4 h-4" />
              <span>By Type</span>
            </button>
            {/* By Snippet */}
            <button
              onClick={() => setViewMode('bySnippet')}
              className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                viewMode === 'bySnippet'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Group className="w-4 h-4" />
              <span>All Snippet</span>
            </button>
            {/* By Occurrence */}
            <button
              onClick={() => setViewMode('byOccurrence')}
              className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                viewMode === 'byOccurrence'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <List className="w-4 h-4" />
              <span>All Occurrences</span>
            </button>
          </div>
          
          <button
            onClick={exportData}
            className="flex items-center space-x-2 px-4 py-2 bg-slate-600 text-white rounded-lg hover:bg-slate-700 transition-colors"
          >
            <Download className="w-4 h-4" />
            <span>Export JSON</span>
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <div className="flex items-center space-x-2 mb-4">
          <Filter className="w-5 h-5 text-slate-600" />
          <h3 className="text-lg font-semibold text-slate-900">Filters</h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Search */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Search
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search URLs, types, or content..."
                className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Type Filter */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Data Type
            </label>
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Types</option>
              {types.map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </div>

          {/* Format Filter */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Format
            </label>
            <select
              value={selectedFormat}
              onChange={(e) => setSelectedFormat(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Formats</option>
              {formats.map(format => (
                <option key={format} value={format}>{format}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Results Grid */}
      {viewMode === 'byType' ? (
        byTypeData.length > 0 ? (
          <div className="space-y-8">
            {byTypeData.map(([categoryKey, snippets]) => (
              <div key={categoryKey} className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="bg-slate-50 px-6 py-4 border-b border-slate-200 flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                      <h3 className="text-lg font-semibold text-slate-900 mb-1 flex items-center space-x-2">
                      {getSnippetIcon(snippets[0].type, TreePine, "w-5 h-5 text-slate-600")}
                      <span>{categoryKey}</span>
                    </h3>
                    <p className="text-sm text-slate-500">
                      {snippets.length} individual structured data (snippet{snippets.length !== 1 ? 's' : ''})
                    </p>
                  </div>
                  <button
                    onClick={() => toggleCategory(categoryKey)}
                    className="flex items-center space-x-2 text-sm text-slate-600 hover:text-slate-900 transition-colors"
                  >
                    {expandedCategories[categoryKey] ? (
                      <ChevronDown className="w-4 h-4" />
                    ) : (
                      <ChevronRight className="w-4 h-4" />
                    )}
                    <span>{expandedCategories[categoryKey] ? 'Hide' : 'Show'} Snippets</span>
                  </button>
                </div>
                {expandedCategories[categoryKey] && (
                  <div className="p-6 space-y-6">
                    {snippets.map((snippet) => (
                      <StructuredDataSnippetCard 
                        key={snippet.hash} 
                        snippet={snippet} 
                        allSnippets={snippetData}
                        currentFormatFilter={selectedFormat}
                      />
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 bg-white rounded-xl border border-slate-200">
            <TreePine className="w-12 h-12 text-slate-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-slate-700 mb-2">No Structured Data Found</h3>
            <p className="text-slate-500">
              Try adjusting your search terms or filters to see more results.
            </p>
          </div>
        )
      ) : viewMode === 'bySnippet' ? (
        filteredSnippetData.length > 0 ? (
          <div className="space-y-6">
            {filteredSnippetData.map((snippet) => (
              <StructuredDataSnippetCard 
                key={snippet.hash} 
                snippet={snippet} 
                allSnippets={snippetData}
                currentFormatFilter={selectedFormat}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-12 bg-white rounded-xl border border-slate-200">
            <Eye className="w-12 h-12 text-slate-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-slate-700 mb-2">No Snippets Found</h3>
            <p className="text-slate-500">
              Try adjusting your search terms or filters to see more results.
            </p>
          </div>
        )
      ) : viewMode === 'byUrl' ? (
        byUrlData.length > 0 ? (
          <div className="space-y-8">
            {byUrlData.map(([url, items]) => (
              <div key={url} className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="bg-slate-50 px-6 py-4 border-b border-slate-200 flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-semibold text-slate-900 mb-1 flex items-center space-x-2">
                      <Globe className="w-5 h-5 text-slate-600" />
                      <span className="truncate">{url}</span>
                    </h3>
                    <p className="text-sm text-slate-500">
                      {items.length} structured data item{items.length !== 1 ? 's' : ''} (occurence{items.length !== 1 ? 's' : ''})
                    </p>
                  </div>
                  <button
                    onClick={() => toggleCategory(url)}
                    className="flex items-center space-x-2 text-sm text-slate-600 hover:text-slate-900 transition-colors ml-4"
                  >
                    {expandedCategories[url] ? (
                      <ChevronDown className="w-4 h-4" />
                    ) : (
                      <ChevronRight className="w-4 h-4" />
                    )}
                    <span>{expandedCategories[url] ? 'Hide' : 'Show'} Items</span>
                  </button>
                </div>
                {expandedCategories[url] && (
                  <div className="p-6">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      {items.map((item, index) => (
                        <StructuredDataCard 
                          key={`${item.url}-${index}`} 
                          item={item} 
                          compact 
                          showUrl={false}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 bg-white rounded-xl border border-slate-200">
            <Globe className="w-12 h-12 text-slate-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-slate-700 mb-2">No URLs Found</h3>
            <p className="text-slate-500">
              Try adjusting your search terms or filters to see more results.
            </p>
          </div>
        )
      ) : (
        filteredData.length > 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {filteredData.map((item, index) => (
            <StructuredDataCard key={`${item.url}-${index}`} item={item} compact showUrl />
          ))}
        </div>
        ) : (
        <div className="text-center py-12 bg-white rounded-xl border border-slate-200">
          <Eye className="w-12 h-12 text-slate-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-slate-700 mb-2">No Results Found</h3>
          <p className="text-slate-500">
            Try adjusting your search terms or filters to see more results.
          </p>
        </div>
        )
      )}
    </div>
  );
}