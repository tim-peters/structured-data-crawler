import React from 'react';
import { StructuredDataItem, StructuredDataSnippet } from '../types/crawler';
import { StructuredDataCard } from './StructuredDataCard';
import { StructuredDataSnippetCard } from './StructuredDataSnippetCard';
import { getSnippetIcon } from '../utils/iconUtils';
import { ViewMode } from '../hooks/useViewData';
import { 
  Globe, 
  TreePine, 
  Group, 
  List, 
  Eye, 
  ChevronDown, 
  ChevronRight 
} from 'lucide-react';

interface ResultsGridProps {
  viewMode: ViewMode;
  filteredData: StructuredDataItem[];
  filteredSnippetData: StructuredDataSnippet[];
  allSnippetData: StructuredDataSnippet[];
  byTypeData: [string, StructuredDataSnippet[]][];
  byUrlData: [string, StructuredDataItem[]][];
  expandedCategories: { [key: string]: boolean };
  onToggleCategory: (key: string) => void;
  currentFormatFilter: string;
}

export function ResultsGrid({
  viewMode,
  filteredData,
  filteredSnippetData,
  allSnippetData,
  byTypeData,
  byUrlData,
  expandedCategories,
  onToggleCategory,
  currentFormatFilter
}: ResultsGridProps) {
  const EmptyState = ({ icon: Icon, title, description }: { 
    icon: React.ElementType; 
    title: string; 
    description: string; 
  }) => (
    <div className="text-center py-12 bg-white rounded-xl border border-slate-200">
      <Icon className="w-12 h-12 text-slate-400 mx-auto mb-4" />
      <h3 className="text-lg font-semibold text-slate-700 mb-2">{title}</h3>
      <p className="text-slate-500">{description}</p>
    </div>
  );

  if (viewMode === 'byType') {
    return byTypeData.length > 0 ? (
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
                  {snippets.length} snippet{snippets.length !== 1 ? 's' : ''}
                </p>
              </div>
              <button
                onClick={() => onToggleCategory(categoryKey)}
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
                    allSnippets={allSnippetData}
                    currentFormatFilter={currentFormatFilter}
                  />
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    ) : (
      <EmptyState 
        icon={TreePine}
        title="No Structured Data Found"
        description="Try adjusting your search terms or filters to see more results."
      />
    );
  }

  if (viewMode === 'bySnippet') {
    return filteredSnippetData.length > 0 ? (
      <div className="space-y-6">
        {filteredSnippetData.map((snippet) => (
          <StructuredDataSnippetCard 
            key={snippet.hash} 
            snippet={snippet} 
            allSnippets={allSnippetData}
            currentFormatFilter={currentFormatFilter}
          />
        ))}
      </div>
    ) : (
      <EmptyState 
        icon={Group}
        title="No Snippets Found"
        description="Try adjusting your search terms or filters to see more results."
      />
    );
  }

  if (viewMode === 'byUrl') {
    return byUrlData.length > 0 ? (
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
                  {items.length} occurrence{items.length !== 1 ? 's' : ''}
                </p>
              </div>
              <button
                onClick={() => onToggleCategory(url)}
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
                      allData={filteredData}
                      compact 
                      showUrl={false}
                      currentFormatFilter={currentFormatFilter}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    ) : (
      <EmptyState 
        icon={Globe}
        title="No URLs Found"
        description="Try adjusting your search terms or filters to see more results."
      />
    );
  }

  // byOccurrence view
  return filteredData.length > 0 ? (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {filteredData.map((item, index) => (
        <StructuredDataCard 
          key={`${item.url}-${index}`} 
          item={item} 
          allData={filteredData}
          compact 
          showUrl={true}
          currentFormatFilter={currentFormatFilter}
        />
      ))}
    </div>
  ) : (
    <EmptyState 
      icon={List}
      title="No Occurrences Found"
      description="Try adjusting your search terms or filters to see more results."
    />
  );
}