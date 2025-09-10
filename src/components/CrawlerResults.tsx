import React, { useState } from 'react';
import { StructuredDataItem, StructuredDataSnippet } from '../types/crawler';
import { FilterBar } from './FilterBar';
import { ViewModeSelector } from './ViewModeSelector';
import { ResultsGrid } from './ResultsGrid';
import { useFilteredData, FilterOptions } from '../hooks/useFilteredData';
import { useViewData, ViewMode } from '../hooks/useViewData';
import { ViewModeProvider } from '../contexts/ViewModeContext';
import { Download } from 'lucide-react';

interface CrawlerResultsProps {
  data: StructuredDataItem[];
  snippetData: StructuredDataSnippet[];
}

export function CrawlerResults({ data, snippetData }: CrawlerResultsProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('byUrl');
  const [showViewModeDropdown, setShowViewModeDropdown] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<FilterOptions>({
    searchTerm: '',
    selectedType: 'all',
    selectedFormat: 'all'
  });

  const {
    filteredData,
    filteredSnippetData,
    uniqueTypes,
    uniqueFormats
  } = useFilteredData(data, snippetData, filters);

  const {
    byTypeData,
    byUrlData,
    expandedCategories,
    toggleCategory
  } = useViewData(filteredData, filteredSnippetData);

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

  const getResultsDescription = () => {
    const baseText = `Found ${data.length} occurrence${data.length !== 1 ? 's' : ''}`;
    
    switch (viewMode) {
      case 'byType':
        return `${baseText} of ${snippetData.length} snippet${snippetData.length !== 1 ? 's' : ''} (${byTypeData.length} type${byTypeData.length !== 1 ? 's' : ''})`;
      case 'byUrl':
        return `${baseText} across ${byUrlData.length} URL${byUrlData.length !== 1 ? 's' : ''}`;
      case 'bySnippet':
        return `${baseText} of ${snippetData.length} snippet${snippetData.length !== 1 ? 's' : ''}`;
      case 'byOccurrence':
      default:
        return baseText;
    }
  };

  return (
    <ViewModeProvider viewMode={viewMode} setViewMode={setViewMode}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-slate-900">
              Discovered Structured Data
            </h2>
            <p className="text-slate-600 mt-1">
              {getResultsDescription()}
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <ViewModeSelector
              viewMode={viewMode}
              onViewModeChange={setViewMode}
              showDropdown={showViewModeDropdown}
              onToggleDropdown={() => setShowViewModeDropdown(!showViewModeDropdown)}
            />
            
            <button
              onClick={exportData}
              className="hidden md:flex items-center space-x-2 px-4 py-2 bg-slate-600 text-white rounded-lg hover:bg-slate-700 transition-colors"
            >
              <Download className="w-4 h-4" />
              <span>Export JSON</span>
            </button>
          </div>
        </div>

        {/* Filters */}
        <FilterBar
          filters={filters}
          onFiltersChange={setFilters}
          types={uniqueTypes}
          formats={uniqueFormats}
          showFilters={showFilters}
          onToggleFilters={() => setShowFilters(!showFilters)}
        />

        {/* Results Grid */}
        <ResultsGrid
          viewMode={viewMode}
          filteredData={filteredData}
          filteredSnippetData={filteredSnippetData}
          allSnippetData={snippetData}
          byTypeData={byTypeData}
          byUrlData={byUrlData}
          expandedCategories={expandedCategories}
          onToggleCategory={toggleCategory}
          currentFormatFilter={filters.selectedFormat}
        />
      </div>
    </ViewModeProvider>
  );
}